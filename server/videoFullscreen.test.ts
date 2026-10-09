import { describe, expect, it, vi } from 'vitest';
import { enterVideoFullscreen } from '../client/src/lib/videoFullscreen';
describe('video fullscreen capability selection', () => {
  it('prefers the standard API without browser-name sniffing', async () => {
    const standard=vi.fn().mockResolvedValue(undefined), native=vi.fn();
    await enterVideoFullscreen({requestFullscreen:standard,webkitEnterFullscreen:native} as unknown as HTMLVideoElement);
    expect(standard).toHaveBeenCalledOnce();expect(native).not.toHaveBeenCalled();
  });
  it('uses native video fullscreen when only that API is available', async () => {
    const native=vi.fn();
    await enterVideoFullscreen({webkitEnterFullscreen:native} as unknown as HTMLVideoElement);
    expect(native).toHaveBeenCalledOnce();
  });
  it('reports unavailable fullscreen rather than silently doing nothing', async () => {
    await expect(enterVideoFullscreen({} as HTMLVideoElement)).rejects.toThrow('Fullscreen is unavailable');
  });
  it('propagates a rejected standard request to the existing player feedback', async () => {
    await expect(enterVideoFullscreen({requestFullscreen:()=>Promise.reject(new Error('Denied'))} as unknown as HTMLVideoElement)).rejects.toThrow('Denied');
  });
  it('propagates synchronous native errors to the existing player feedback', async () => {
    await expect(enterVideoFullscreen({webkitEnterFullscreen:()=>{throw new Error('Denied')}} as unknown as HTMLVideoElement)).rejects.toThrow('Denied');
  });
});
