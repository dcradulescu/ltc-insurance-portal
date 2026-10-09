import {describe,it,expect} from 'vitest';
import {readVisitor,signVisitor} from './visitorSession';
const id='12345678-1234-1234-1234-123456789abc';
const secret='test-secret-with-at-least-32-characters';
describe('private visitor tokens',()=>{
 it('accepts a valid signed token',()=>expect(readVisitor(signVisitor(id,secret,1000),secret,1001)).toBe(id));
 it('rejects altered identities and signatures',()=>{
  const token=signVisitor(id,secret,1000);
  expect(readVisitor(token.replace('12345678','87654321'),secret,1001)).toBeNull();
  expect(readVisitor(token+'x',secret,1001)).toBeNull();
  expect(readVisitor(token,'another-secret',1001)).toBeNull();
 });
 it('rejects expired and malformed tokens',()=>{
  expect(readVisitor(signVisitor(id,secret,0),secret,31*86400000)).toBeNull();
  for(const token of [undefined,'','x.y.z','a.1.b.c']) expect(readVisitor(token,secret)).toBeNull();
 });
});
