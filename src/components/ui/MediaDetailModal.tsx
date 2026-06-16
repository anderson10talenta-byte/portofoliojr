import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import type { Media } from "@workspace/api-client-react";

/* ── embed helpers ───────────────────────────────────────────── */
function getYouTubeEmbedUrl(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` : null;
}
function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov|mkv|ogg)(\?|$)/i.test(url) || url.includes("/api/uploads/");
}

/* ── types ───────────────────────────────────────────────────── */
interface MediaDetailModalProps {
  items: Media[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

/* ── VideoDisplay ────────────────────────────────────────────── */
function VideoDisplay({ url, title }: { url: string; title: string }) {
  const yt = getYouTubeEmbedUrl(url);
  const dv = isDirectVideo(url);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
      {yt && (
        <iframe src={yt} className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen title={title} />
      )}
      {!yt && dv && (
        <video src={url} className="absolute inset-0 w-full h-full" controls autoPlay />
      )}
      {!yt && !dv && (
        <iframe src={url} className="absolute inset-0 w-full h-full" allowFullScreen title={title} />
      )}
    </div>
  );
}

/* ── GalleryDisplay ─────────────────────────────────────────── */
function GalleryDisplay({ url, title, galleryUrls }: { url: string; title: string; galleryUrls?: string[] }) {
  const images = galleryUrls && galleryUrls.length > 0 ? galleryUrls : [url];
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef<number>(0);
  const isMulti = images.length > 1;

  const goPrev = useCallback(() => {
    setZoomed(false);
    setActiveIdx(i => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setZoomed(false);
    setActiveIdx(i => (i + 1) % images.length);
  }, [images.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative w-full flex items-center justify-center rounded-2xl overflow-hidden bg-black/40 min-h-[200px]"
        onTouchStart={isMulti ? onTouchStart : undefined}
        onTouchEnd={isMulti ? onTouchEnd : undefined}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIdx}
            src={images[activeIdx]}
            alt={`${title} — ${activeIdx + 1}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0, scale: zoomed ? 1.85 : 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={() => setZoomed(z => !z)}
            className={`max-h-[55vh] lg:max-h-[68vh] w-full object-contain select-none ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          />
        </AnimatePresence>

        {/* Zoom toggle */}
        <button
          onClick={() => setZoomed(z => !z)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
          title={zoomed ? "Zoom out" : "Zoom in"}
        >
          {zoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
        </button>

        {/* Prev/Next arrows (multi only) */}
        {isMulti && !zoomed && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10 mr-10"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Counter pill */}
        {isMulti && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white text-xs font-mono z-10">
            {activeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip (multi only) */}
      {isMulti && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => { setZoomed(false); setActiveIdx(i); }}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeIdx ? "border-primary shadow-[0_0_10px_rgba(255,215,0,0.3)]" : "border-white/10 hover:border-white/30"
              }`}
            >
              <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── main component ──────────────────────────────────────────── */
export function MediaDetailModal({ items, initialIndex, open, onClose }: MediaDetailModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const current = items[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, open]);

  const goPrev = useCallback(() =>
    setCurrentIndex(i => (i - 1 + items.length) % items.length), [items.length]);

  const goNext = useCallback(() =>
    setCurrentIndex(i => (i + 1) % items.length), [items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goPrev, goNext]);

  if (!current) return null;

  const isVideo = current.type === "video";

  return (
    <AnimatePresence>
      {open && (
        /* backdrop */
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/92 backdrop-blur-md p-4 sm:p-6"
          onClick={onClose}
        >
          {/* modal card */}
          <motion.div
            key={`card-${currentIndex}`}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0f0f0f] border border-white/8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
            >
              <X size={16} />
            </button>

            {/* layout: mobile stacked / desktop side-by-side */}
            <div className="flex flex-col lg:flex-row lg:min-h-[540px]">

              {/* ── LEFT: media ── */}
              <div className="lg:w-[62%] p-5 lg:p-7 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`media-${currentIndex}`}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 18 }}
                    transition={{ duration: 0.22 }}
                  >
                    {isVideo
                      ? <VideoDisplay url={current.url} title={current.title} />
                      : <GalleryDisplay url={current.url} title={current.title} galleryUrls={current.galleryUrls} />
                    }
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ── RIGHT: info panel ── */}
              <div className="lg:w-[38%] border-t lg:border-t-0 lg:border-l border-white/6 flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`info-${currentIndex}`}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.22 }}
                    className="flex flex-col h-full p-6 lg:p-8"
                  >
                    {/* type badge */}
                    <div className="flex items-center gap-2 mb-5">
                      <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full bg-primary/10 border border-primary/30 text-primary">
                        {current.type}
                      </span>
                      {current.category && (
                        <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-full bg-white/8 border border-white/10 text-white/70">
                          {current.category}
                        </span>
                      )}
                    </div>

                    {/* title */}
                    <h2 className="text-2xl lg:text-3xl font-display font-black text-white leading-snug mb-4">
                      {current.title}
                    </h2>

                    {/* divider */}
                    <div className="h-px bg-gradient-to-r from-primary/40 to-transparent mb-5" />

                    {/* description */}
                    {current.description ? (
                      <p className="text-white/60 leading-relaxed text-sm lg:text-base flex-1">
                        {current.description}
                      </p>
                    ) : (
                      <p className="text-white/25 italic text-sm flex-1">No description provided.</p>
                    )}

                    {/* navigation between portfolio items */}
                    {items.length > 1 && (
                      <div className="mt-8 pt-5 border-t border-white/6">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={goPrev}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/6 hover:bg-white/12 border border-white/8 text-white text-sm font-medium transition-all hover:border-white/20"
                          >
                            <ChevronLeft size={16} /> Prev
                          </button>

                          {/* dot indicators */}
                          <div className="flex gap-1.5">
                            {items.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`rounded-full transition-all duration-200 ${
                                  i === currentIndex
                                    ? "w-5 h-2 bg-primary"
                                    : "w-2 h-2 bg-white/20 hover:bg-white/40"
                                }`}
                              />
                            ))}
                          </div>

                          <button
                            onClick={goNext}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/6 hover:bg-white/12 border border-white/8 text-white text-sm font-medium transition-all hover:border-white/20"
                          >
                            Next <ChevronRight size={16} />
                          </button>
                        </div>
                        <p className="text-center text-white/25 text-xs font-mono mt-3">
                          {currentIndex + 1} / {items.length}
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
