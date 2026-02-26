import { Play } from "lucide-react";

type VideoPlaceholderProps = {
  title: string;
  description?: string;
  className?: string;
  thumbnailUrl?: string;
};

export function VideoPlaceholder({ title, description, className = "", thumbnailUrl }: VideoPlaceholderProps) {
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
