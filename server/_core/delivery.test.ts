import {describe,it,expect,vi,afterEach} from 'vitest';
import {deliver,resumeOrigin} from './delivery';
import {ENV} from './env';
vi.mock('./env',()=>({ENV:{zapierWebhookUrl:''}}));
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();ENV.zapierWebhookUrl='';});
describe('truthful delivery',()=>{
 it('fails without configured delivery',async()=>{await expect(deliver({})).rejects.toMatchObject({code:'SERVICE_UNAVAILABLE'});});
 it('rejects insecure providers',async()=>{ENV.zapierWebhookUrl='http://example.com';await expect(deliver({})).rejects.toMatchObject({code:'SERVICE_UNAVAILABLE'});});
 it.each([500,403])('rejects provider status %s',async(status)=>{ENV.zapierWebhookUrl='https://example.com';vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status}));await expect(deliver({})).rejects.toMatchObject({code:'BAD_GATEWAY'});});
 it('reports acceptance without claiming inbox arrival',async()=>{ENV.zapierWebhookUrl='https://example.com';const request=vi.fn().mockResolvedValue({ok:true});vi.stubGlobal('fetch',request);expect(await deliver({type:'test'})).toMatchObject({status:'accepted'});expect(request.mock.calls[0][1]).toMatchObject({redirect:'error',method:'POST'});});
 it('reports transport failures',async()=>{ENV.zapierWebhookUrl='https://example.com';vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('timeout')));await expect(deliver({})).rejects.toMatchObject({code:'BAD_GATEWAY'});});
 it('requires a trusted application origin',()=>{vi.stubEnv('APP_URL','https://portal.example.com/path');expect(resumeOrigin()).toBe('https://portal.example.com');vi.stubEnv('APP_URL','invalid');expect(resumeOrigin).toThrow();});
});
