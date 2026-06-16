import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const angles = { top: 0, right: 90, bottom: 180, left: 270 } as const;

export function ProgressiveBlur({
  direction = "bottom",
  blurLayers = 8,
  blurIntensity = 1,
  className,
  ...props
}: { direction?: keyof typeof angles; blurLayers?: number; blurIntensity?: number } & HTMLMotionProps<"div">) {
  const layers = Math.max(blurLayers, 2);
  const segment = 1 / (layers + 1);
  return (
    <div className={cn("relative", className)}>
      {Array.from({ length: layers }).map((_, index) => {
        const stops = [index, index + 1, index + 2, index + 3].map((position, stopIndex) =>
          `rgba(255,255,255,${stopIndex === 1 || stopIndex === 2 ? 1 : 0}) ${position * segment * 100}%`
        );
        const mask = `linear-gradient(${angles[direction]}deg, ${stops.join(",")})`;
        return <motion.div key={index} className="pointer-events-none absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask, backdropFilter: `blur(${index * blurIntensity}px)` }} {...props} />;
      })}
    </div>
  );
}
