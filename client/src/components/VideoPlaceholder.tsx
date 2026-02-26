import { Play, Video } from "lucide-react";

type VideoPlaceholderProps = {
  title: string;
  description?: string;
  className?: string;
};

export function VideoPlaceholder({ title, description, className = "" }: VideoPlaceholderProps) {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-[#2c3e50] to-[#34495e] ${className}`}>
      <div className="aspect-video flex flex-col items-center justify-center text-white p-8">
        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer group">
          <Play className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Video className="w-4 h-4 text-primary" />
          <span className="text-xs uppercase tracking-wider text-white/60 font-medium">Explainer Video</span>
        </div>
        <h3 className="font-serif text-xl font-bold text-center mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-white/70 text-center max-w-md">{description}</p>
        )}
        <div className="absolute bottom-4 right-4 text-xs text-white/40">
          Video coming soon
        </div>
      </div>
    </div>
  );
}
