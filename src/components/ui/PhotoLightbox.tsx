import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import type { Media } from "@workspace/api-client-react";

interface PhotoLightboxProps {
  photos: Media[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export function PhotoLightbox({ photos, initialIndex, open, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  const current = photos[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomed(false);
  }, [initialIndex, open]);

  const goNext = useCallback(() => {
    setZoomed(false);
    setCurrentIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setZoomed(false);
    setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, goNext, goPrev]);

  if (!current) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-10 bg-gradient-to-b from-black/60 to-transparent">
            <div>
              <p className="text-white font-bold text-base leading-tight">{current.title}</p>
              {current.category && (
                <span className="text-xs text-primary font-semibold uppercase tracking-widest">{current.category}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title={zoomed ? "Zoom out" : "Zoom in"}
              >
                {zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Prev button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative flex items-center justify-center px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              src={current.url}
              alt={current.title}
              animate={{ scale: zoomed ? 2 : 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={() => setZoomed((z) => !z)}
              className={`max-w-[85vw] max-h-[85vh] object-contain rounded-xl shadow-2xl select-none ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            />
          </motion.div>

          {/* Next button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-110"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Bottom counter + dots */}
          {photos.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
              <div className="flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setZoomed(false); setCurrentIndex(i); }}
                    className={`rounded-full transition-all duration-200 ${
                      i === currentIndex
                        ? "w-6 h-2 bg-primary"
                        : "w-2 h-2 bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
              <p className="text-white/40 text-xs font-mono">
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
