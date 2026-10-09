import { useState } from "react";
export function YouTubeLesson({ videoId, title }: { videoId: string; title: string }) {
  const [started, setStarted] = useState(false);
  return <div className="space-y-3">
    <div className="aspect-video overflow-hidden rounded-2xl border-2 border-teal bg-slate-900">
      {started ? <iframe key={videoId} className="h-full w-full" title={title} src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        : <button type="button" onClick={() => setStarted(true)} className="h-full w-full p-6 text-center text-white hover:bg-slate-800 focus-visible:outline-4 focus-visible:outline-teal"><span className="block text-4xl mb-3" aria-hidden="true">▶</span><span className="block font-bold">Play: {title}</span><span className="block mt-2 text-sm text-slate-300">External sample lesson · Loads YouTube when played</span></button>}
    </div>
    <a className="text-sm underline text-teal-700" href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">Open this lesson on YouTube</a>
  </div>;
}
