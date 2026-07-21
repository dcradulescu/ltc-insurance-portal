import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { useState, useRef, useCallback } from "react";

type VideoPlaceholderProps = {
  title: string;
  description?: string;
  className?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
};

export function VideoPlaceholder({ title, description, className = "", thumbnailUrl, videoUrl }: VideoPlaceholderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      // Auto-hide controls after 3 seconds
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, []);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, handlePlay, handlePause]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    if (isPlaying) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(pct);
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pct * videoRef.current.duration;
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setShowControls(true);
    setProgress(0);
  }, []);

  const handleError = useCallback(() => {
    setIsPlaying(false);
    setShowControls(true);
  }, []);

  const handleCanPlay = useCallback(() => {
    // Video is ready to play
  }, []);

  // If we have a video URL, render the actual video player
  if (videoUrl) {
    return (
      <div
        className={`relative rounded-xl overflow-hidden bg-black ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            poster={thumbnailUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={handleError}
            onCanPlay={handleCanPlay}
            muted={isMuted}
            playsInline
            preload="metadata"
          />

          {/* Overlay - click to toggle play/pause */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"} cursor-pointer`}
            onClick={handleTogglePlay}
          >
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Center play button - only show when not playing or controls visible */}
            {!isPlaying && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 hover:bg-primary transition-colors group shadow-xl">
                  <Play className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-white text-sm mt-4 text-center px-4 max-w-lg font-medium drop-shadow-lg">
                  {description || title}
                </p>
              </div>
            )}

            {/* Bottom controls bar */}
            <div
              className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Play/Pause button */}
              <button
                onClick={handleTogglePlay}
                className="text-white hover:text-primary transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              {/* Progress bar */}
              <div
                className="flex-1 h-1.5 bg-white/30 rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-primary rounded-full relative transition-all"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
                </div>
              </div>

              {/* Mute button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:text-primary transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* Fullscreen button */}
              <button
                onClick={handleFullscreen}
                className="text-white hover:text-primary transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: thumbnail-only placeholder
  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {thumbnailUrl ? (
        <div className="relative aspect-video">
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors cursor-pointer group">
              <Play className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" />
            </div>
            {description && (
              <p className="text-white/80 text-sm mt-4 text-center px-4 max-w-lg">{description}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#2c3e50] to-[#34495e] aspect-video flex flex-col items-center justify-center text-white p-8">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer group">
            <Play className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-xl font-serif font-bold mb-2 text-center">{title}</h3>
          {description && (
            <p className="text-white/70 text-sm text-center max-w-md">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
