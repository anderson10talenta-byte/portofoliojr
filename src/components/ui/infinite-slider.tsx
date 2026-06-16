import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import useMeasure from "react-use-measure";
import { cn } from "@/lib/utils";

export function InfiniteSlider({ children, gap = 56, duration = 30, className }: { children: ReactNode; gap?: number; duration?: number; className?: string }) {
  const [ref, { width }] = useMeasure();
  const translation = useMotionValue(0);

  useEffect(() => {
    if (!width) return;
    const distance = width + gap;
    const controls = animate(translation, [0, -distance], {
      duration,
      repeat: Infinity,
      repeatType: "loop",
      ease: "linear",
      onRepeat: () => translation.set(0),
    });
    return () => controls.stop();
  }, [duration, gap, translation, width]);

  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div className="flex w-max items-center" style={{ x: translation, gap }}>
        <div ref={ref} className="flex items-center" style={{ gap }}>
          {children}
        </div>
        <div aria-hidden="true" className="flex items-center" style={{ gap }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
