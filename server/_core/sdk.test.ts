import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';
import { sdk } from './sdk';
import { ENV } from './env';
vi.mock('./env', () => ({ ENV: { cookieSecret: '', appId: 'qa-app', oAuthServerUrl: '' } }));
const key = 'qa-secret-that-is-at-least-32-bytes-long';
const session = { openId: 'qa-user', appId: 'qa-app', name: 'QA person' };
beforeEach(() => { ENV.cookieSecret = key; ENV.appId = 'qa-app'; });
const sign = (claims = session, secret = key, expiry = '1h') => new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(expiry).sign(new TextEncoder().encode(secret));
describe('OAuth session validation', () => {
  it('accepts a valid session issued for this application', async () => {
    const token = await sdk.signSession(session);
    expect(await sdk.verifySession(token)).toEqual(session);
  });
  it.each(['', 'short-secret'])('rejects absent or weak configured signing keys: %s', async secret => {
    ENV.cookieSecret = secret;
    await expect(sdk.signSession(session)).rejects.toThrow('securely');
    expect(await sdk.verifySession(await sign(session, secret || 'x'))).toBeNull();
  });
  it('rejects a correctly signed token for another application', async () => {
    expect(await sdk.verifySession(await sign({ ...session, appId: 'another-app' }))).toBeNull();
    await expect(sdk.signSession({ ...session, appId: 'another-app' })).rejects.toThrow('application');
  });
  it('rejects unconfigured application identity', async () => {
    const token = await sign(); ENV.appId = '';
    expect(await sdk.verifySession(token)).toBeNull();
    await expect(sdk.signSession(session)).rejects.toThrow('application');
  });
  it('rejects expired, malformed and altered tokens', async () => {
    expect(await sdk.verifySession(await sign(session, key, '-1s'))).toBeNull();
    const token = await sign();
    expect(await sdk.verifySession(token + 'x')).toBeNull();
    expect(await sdk.verifySession('not-a-token')).toBeNull();
    expect(await sdk.verifySession(undefined)).toBeNull();
  });
});
