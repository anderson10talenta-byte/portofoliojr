"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Image as ImageIcon, Play, Video, X } from "lucide-react";

export interface BentoGalleryItem {
  id: number;
  type: string;
  title: string;
  desc: string;
  url: string;
  thumbnailUrl?: string | null;
  span: string;
  category?: string | null;
}

interface InteractiveBentoGalleryProps {
  mediaItems: BentoGalleryItem[];
  title: string;
  description: string;
  onItemOpen?: (item: BentoGalleryItem, index: number, items: BentoGalleryItem[]) => void;
}

const isDirectVideo = (url: string) => /\.(mp4|webm|ogg)(\?|$)/i.test(url);

function MediaItem({
  item,
  className,
  onClick,
}: {
  item: BentoGalleryItem;
  className?: string;
  onClick?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isBuffering, setIsBuffering] = useState(item.type === "video" && isDirectVideo(item.url));
  const reducedMotion = useReducedMotion();
  const poster = item.thumbnailUrl || item.url;
  const canPreviewVideo = item.type === "video" && isDirectVideo(item.url) && !reducedMotion;

  useEffect(() => {
    if (!canPreviewVideo || !videoRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { root: null, rootMargin: "80px", threshold: 0.12 },
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [canPreviewVideo]);

  useEffect(() => {
    if (!canPreviewVideo || !videoRef.current) return;
    let mounted = true;
    const video = videoRef.current;

    const handleVideoPlay = async () => {
      if (!isInView || !mounted) return;
      try {
        if (video.readyState < 3) {
          setIsBuffering(true);
          await new Promise((resolve) => {
            video.oncanplay = resolve;
          });
        }
        if (mounted) {
          setIsBuffering(false);
          await video.play();
        }
      } catch {
        setIsBuffering(false);
      }
    };

    if (isInView) handleVideoPlay();
    else video.pause();

    return () => {
      mounted = false;
      video.pause();
    };
  }, [canPreviewVideo, isInView]);

  if (canPreviewVideo) {
    return (
      <div className={`${className} relative overflow-hidden`} onClick={onClick}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          loop
          preload="metadata"
          poster={poster}
          style={{
            opacity: isBuffering ? 0.82 : 1,
            transform: "translateZ(0)",
            transition: "opacity 180ms ease",
            willChange: "transform",
          }}
        >
          <source src={item.url} type="video/mp4" />
        </video>
        {isBuffering && (
          <div className="absolute inset-0 grid place-items-center bg-black/16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`} onClick={onClick}>
      <img
        src={poster}
        alt={item.title}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      {item.type === "video" && (
        <div className="absolute inset-0 grid place-items-center bg-black/10">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-white/45 bg-black/30 text-white shadow-2xl backdrop-blur-md">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </span>
        </div>
      )}
    </div>
  );
}

function GalleryModal({
  selectedItem,
  isOpen,
  onClose,
  setSelectedItem,
  mediaItems,
}: {
  selectedItem: BentoGalleryItem;
  isOpen: boolean;
  onClose: () => void;
  setSelectedItem: (item: BentoGalleryItem | null) => void;
  mediaItems: BentoGalleryItem[];
}) {
  const [dockPosition, setDockPosition] = useState({ x: 0, y: 0 });

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
        className="fixed inset-0 z-[260] min-h-dvh overflow-hidden bg-black/82 p-3 backdrop-blur-xl sm:p-6"
      >
        <div className="flex h-full items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedItem.id}
              className="relative aspect-[16/10] w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111414] shadow-2xl shadow-black/50"
              initial={{ y: 20, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.97, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <MediaItem item={selectedItem} className="absolute inset-0 h-full w-full" onClick={onClose} />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 to-transparent p-5 sm:p-7">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/54">
                  {selectedItem.category || selectedItem.type}
                </p>
                <h3 className="font-display text-2xl font-semibold text-white sm:text-4xl">{selectedItem.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">{selectedItem.desc}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.button
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/18"
          onClick={onClose}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Close gallery preview"
        >
          <X className="h-4 w-4" />
        </motion.button>
      </motion.div>

      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        initial={false}
        animate={{ x: dockPosition.x, y: dockPosition.y }}
        onDragEnd={(_, info) => {
          setDockPosition((prev) => ({
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y,
          }));
        }}
        className="fixed bottom-4 left-1/2 z-[280] -translate-x-1/2 touch-none"
      >
        <motion.div className="relative cursor-grab rounded-2xl border border-white/15 bg-white/10 shadow-2xl shadow-black/40 backdrop-blur-xl active:cursor-grabbing">
          <div className="flex items-center -space-x-2 px-3 py-2">
            {mediaItems.map((item, index) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedItem(item);
                }}
                style={{ zIndex: selectedItem.id === item.id ? 30 : mediaItems.length - index }}
                className={`relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl ${
                  selectedItem.id === item.id ? "ring-2 ring-white/80" : "hover:ring-2 hover:ring-white/30"
                }`}
                initial={{ rotate: index % 2 === 0 ? -12 : 12 }}
                animate={{
                  scale: selectedItem.id === item.id ? 1.16 : 1,
                  rotate: selectedItem.id === item.id ? 0 : index % 2 === 0 ? -12 : 12,
                  y: selectedItem.id === item.id ? -7 : 0,
                }}
                whileHover={{ scale: 1.2, rotate: 0, y: -8 }}
                aria-label={`Open ${item.title}`}
              >
                <MediaItem item={item} className="h-full w-full" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

export default function InteractiveBentoGallery({
  mediaItems,
  title,
  description,
  onItemOpen,
}: InteractiveBentoGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<BentoGalleryItem | null>(null);
  const [items, setItems] = useState(mediaItems);
  const [isDragging, setIsDragging] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setItems(mediaItems);
  }, [mediaItems]);

  const visibleItems = useMemo(() => items.slice(0, 8), [items]);

  const openItem = (item: BentoGalleryItem, index: number) => {
    if (isDragging) return;
    if (onItemOpen) onItemOpen(item, index, visibleItems);
    else setSelectedItem(item);
  };

  return (
    <div className="relative">
      <div className="relative mb-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4a454]">Interactive gallery</p>
          <h3 className="mt-3 font-display text-3xl font-light leading-tight text-white md:text-5xl">{title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">{description}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedItem ? (
          <GalleryModal
            selectedItem={selectedItem}
            isOpen={true}
            onClose={() => setSelectedItem(null)}
            setSelectedItem={setSelectedItem}
            mediaItems={visibleItems}
          />
        ) : (
          <motion.div
            className="relative grid auto-rows-[72px] grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-4 md:auto-rows-[84px] lg:auto-rows-[92px]"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: reducedMotion ? 0 : 0.045 },
              },
            }}
          >
            {visibleItems.map((item, index) => (
              <motion.button
                type="button"
                key={item.id}
                layoutId={`media-${item.id}`}
                className={`group relative overflow-hidden rounded-[1.1rem] border border-white/10 bg-white/[0.035] text-left touch-manipulation ${item.span}`}
                onClick={() => openItem(item, index)}
                variants={{
                  hidden: { y: reducedMotion ? 0 : 28, scale: reducedMotion ? 1 : 0.96, opacity: 0 },
                  visible: {
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 330,
                      damping: 26,
                      delay: reducedMotion ? 0 : index * 0.025,
                    },
                  },
                }}
                whileHover={reducedMotion ? undefined : { y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                drag={!reducedMotion}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.75}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(_, info) => {
                  setIsDragging(false);
                  const moveDistance = info.offset.x + info.offset.y;
                  if (Math.abs(moveDistance) > 50) {
                    const newItems = [...items];
                    const draggedItem = newItems[index];
                    const targetIndex = moveDistance > 0 ? Math.min(index + 1, items.length - 1) : Math.max(index - 1, 0);
                    newItems.splice(index, 1);
                    newItems.splice(targetIndex, 0, draggedItem);
                    setItems(newItems);
                  }
                }}
                aria-label={`Open ${item.title}`}
              >
                <MediaItem item={item} className="absolute inset-0 h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/84 via-black/16 to-transparent opacity-82 transition duration-300 group-hover:opacity-100" />
                <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/28 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/62 backdrop-blur-md">
                  {item.type === "video" ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                  {item.category || item.type}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h4 className="line-clamp-1 text-sm font-semibold text-white md:text-base">{item.title}</h4>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/62">{item.desc}</p>
                </div>
                <div className="absolute inset-0 opacity-0 ring-1 ring-inset ring-white/20 transition duration-300 group-hover:opacity-100" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
