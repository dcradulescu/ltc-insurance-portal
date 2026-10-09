import {beforeEach, describe, expect, it, vi} from 'vitest';
import {chatRouter} from './routers/chat';
import {invokeLLM} from './_core/llm';
import {getDb, getPolicyById} from './db';
import type {TrpcContext} from './_core/context';
const {rows,filters}=vi.hoisted(()=>({rows:[] as any[],filters:[] as any[]}));
vi.mock('./db',()=>({getDb:vi.fn(),getPolicyById:vi.fn()}));
vi.mock('./_core/llm',()=>({invokeLLM:vi.fn()}));
vi.mock('drizzle-orm',async original=>({...await original<typeof import('drizzle-orm')>(),eq:(_column:unknown,value:unknown)=>({session:value})}));
function caller(id:number){return chatRouter.createCaller({user:{id},req:{headers:{}},res:{}} as TrpcContext);}
beforeEach(()=>{
 rows.length=0;filters.length=0;vi.clearAllMocks();
 vi.mocked(invokeLLM).mockResolvedValue({choices:[{message:{content:'Example response'}}]} as any);
 vi.mocked(getPolicyById).mockResolvedValue(undefined);
 vi.mocked(getDb).mockResolvedValue({
  insert:()=>({values:async(row:any)=>{rows.push(row)}}),
  select:()=>({from:()=>({where:(filter:any)=>{
   filters.push(filter);
   return {limit:async()=>[],orderBy:()=>({limit:async()=>rows.filter(r=>r.sessionId===filter.session).slice().reverse()})};
  }})}),
 } as any);
});
describe('current chat router',()=>{
 it('sends each user message once to the model and records the successful turn',async()=>{
  const result=await caller(7).send({message:'Hello',sessionId:'shared'});
  expect(result).toEqual({content:'Example response',sessionId:'shared'});
  expect(vi.mocked(invokeLLM).mock.calls[0][0].messages.filter(m=>m.role==='user')).toEqual([{role:'user',content:'Hello'}]);
  expect(rows.map(r=>[r.sessionId,r.role])).toEqual([['7:shared','user'],['7:shared','assistant']]);
 });
 it('isolates identical client session IDs belonging to different visitors',async()=>{
  await caller(7).send({message:'Private question',sessionId:'shared'});
  expect(await caller(8).getHistory({sessionId:'shared'})).toEqual([]);
  expect(await caller(7).getHistory({sessionId:'shared'})).toHaveLength(2);
  expect(filters).toContainEqual({session:'8:shared'});
 });
 it('does not inject another visitor policy into the model prompt',async()=>{
  vi.mocked(getPolicyById).mockResolvedValue({id:123,userId:8,insuredFullName:'PRIVATE_OTHER_NAME'} as any);
  await caller(7).send({message:'Explain',policyId:123});
  expect(JSON.stringify(vi.mocked(invokeLLM).mock.calls[0][0])).not.toContain('PRIVATE_OTHER_NAME');
 });
 it('propagates model failure without recording a fabricated response',async()=>{
  vi.mocked(invokeLLM).mockRejectedValue(new Error('Provider unavailable'));
  await expect(caller(7).send({message:'Hello'})).rejects.toThrow('Provider unavailable');
  expect(rows).toHaveLength(0);
 });
 it('rejects oversized session identifiers',async()=>{
  await expect(caller(7).getHistory({sessionId:'x'.repeat(101)})).rejects.toMatchObject({code:'BAD_REQUEST'});
 });
});
