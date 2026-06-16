import { Play, ZoomIn, Images } from "lucide-react";
import { motion } from "framer-motion";
import type { Media } from "@workspace/api-client-react";

interface MediaCardProps {
  media: Media;
  onClick?: () => void;
  href?: string;
  size?: "default" | "large";
}

export function MediaCard({ media, onClick, href, size = "default" }: MediaCardProps) {
  const isVideo = media.type === "video";
  const isPhoto = media.type === "photo";
  const displayImage = media.thumbnailUrl || media.url;
  const extraCount = (media.galleryUrls?.length ?? 0) > 1 ? media.galleryUrls.length - 1 : 0;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className={`group relative overflow-hidden rounded-lg border border-white/8 bg-card cursor-pointer ${
        size === "large" ? "aspect-[16/10] lg:h-full lg:min-h-[520px]" : "aspect-video"
      }`}
      onClick={onClick}
    >
      <img
        src={displayImage}
        alt={media.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
      
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 scale-90 items-center justify-center rounded-md bg-primary/95 text-primary-foreground shadow-[0_0_30px_rgba(255,214,87,0.28)] transition-transform duration-300 group-hover:scale-105">
            <Play className="ml-1 w-6 h-6 fill-current" />
          </div>
        </div>
      )}

      {isPhoto && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/20 bg-white/15 backdrop-blur-sm">
            <ZoomIn className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {extraCount > 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/15 text-white text-xs font-semibold">
          <Images size={11} />
          +{extraCount}
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 p-6 w-full">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md border border-primary/20 bg-black/50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary backdrop-blur-md">
            {media.type}
          </span>
          {media.category && (
            <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-md">
              {media.category}
            </span>
          )}
        </div>
        <h3 className={`font-display font-bold text-white transition-colors group-hover:text-primary ${
          size === "large" ? "text-3xl md:text-4xl" : "text-xl"
        }`}>
          {href ? (
            <a
              href={href}
              onClick={(e) => { e.preventDefault(); onClick?.(); }}
              className="hover:text-primary transition-colors"
            >
              {media.title}
            </a>
          ) : (
            media.title
          )}
        </h3>
      </div>
    </motion.div>
  );
}
