import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerOAuthRoutes } from './oauth';
import { sdk } from './sdk';
vi.mock('./sdk', () => ({ sdk: { exchangeCodeForToken: vi.fn(), getUserInfo: vi.fn(), createSessionToken: vi.fn() } }));
vi.mock('../db', () => ({ upsertUser: vi.fn() }));
let callback: (req: any, res: any) => Promise<void>;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(sdk.exchangeCodeForToken).mockResolvedValue({ accessToken: 'qa-token' } as any);
  vi.mocked(sdk.getUserInfo).mockResolvedValue({ openId: 'qa-user', name: 'QA user' } as any);
  vi.mocked(sdk.createSessionToken).mockResolvedValue('qa-session');
  registerOAuthRoutes({ get: (_path: string, handler: typeof callback) => { callback = handler; } } as any);
});
async function invoke(query: Record<string, unknown>) {
  const res = { cookie: vi.fn(), redirect: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
  await callback({ query: { code: 'qa-code', state: 'qa-state', ...query }, protocol: 'https', hostname: 'portal.example', headers: {} }, res);
  return res;
}
describe('OAuth return navigation', () => {
  it.each(['https://other.example/', '//other.example/', '/\\other.example/', 'javascript:alert(1)', '/\n/other.example/', ['/', '//other.example/']])('does not redirect off-site: %j', async value => {
    const res = await invoke({ returnPath: value });
    expect(res.redirect).toHaveBeenCalledWith(302, '/');
  });
  it('retains a local route, query and fragment after login', async () => {
    const res = await invoke({ returnPath: '/policy-form?resume=qa#policy-form-start' });
    expect(res.cookie).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(302, '/policy-form?resume=qa#policy-form-start');
  });
  it('rejects missing authorization parameters before calling the provider', async () => {
    const res = await invoke({ code: undefined });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(sdk.exchangeCodeForToken).not.toHaveBeenCalled();
  });
});
