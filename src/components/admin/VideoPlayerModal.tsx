import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface VideoPlayerModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
  }
  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov|mkv)(\?|$)/i.test(url);
}

export function VideoPlayerModal({ open, onClose, url, title }: VideoPlayerModalProps) {
  const youtubeEmbed = getYouTubeEmbedUrl(url);
  const directVideo = isDirectVideo(url);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-lg truncate pr-8">{title}</h3>
              <button
                onClick={onClose}
                className="absolute right-0 top-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10">
              {youtubeEmbed && (
                <iframe
                  src={youtubeEmbed}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={title}
                />
              )}
              {!youtubeEmbed && directVideo && (
                <video
                  src={url}
                  className="absolute inset-0 w-full h-full"
                  controls
                  autoPlay
                />
              )}
              {!youtubeEmbed && !directVideo && (
                <iframe
                  src={url}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  title={title}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
