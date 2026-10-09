/** Prefer the standard API; iPhone Safari can expose only native video fullscreen. */
export async function enterVideoFullscreen(video: HTMLVideoElement): Promise<void> {
  if (typeof video.requestFullscreen === "function") {
    await video.requestFullscreen();
    return;
  }
  const nativeVideo = video as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
  if (typeof nativeVideo.webkitEnterFullscreen === "function") {
    nativeVideo.webkitEnterFullscreen();
    return;
  }
  throw new Error("Fullscreen is unavailable in this browser.");
}
