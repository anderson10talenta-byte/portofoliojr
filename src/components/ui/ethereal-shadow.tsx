import { animate, useMotionValue, type AnimationPlaybackControls } from "framer-motion";
import { useEffect, useId, useRef, type CSSProperties } from "react";

const maskUrl = `url('${import.meta.env.BASE_URL}images/ethereal-mask.png')`;
const noiseUrl = `url('${import.meta.env.BASE_URL}images/ethereal-noise.png')`;

interface EtherealShadowProps {
  sizing?: "fill" | "stretch";
  color?: string;
  animation?: { scale: number; speed: number };
  noise?: { opacity: number; scale: number };
  style?: CSSProperties;
  className?: string;
}

function mapRange(value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number) {
  if (fromLow === fromHigh) return toLow;
  return toLow + ((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow);
}

export function EtherealShadow({
  sizing = "fill",
  color = "rgba(128, 128, 128, 1)",
  animation,
  noise,
  style,
  className,
}: EtherealShadowProps) {
  const id = `shadowoverlay-${useId().replace(/:/g, "")}`;
  const colorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
  const hueRotate = useMotionValue(180);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const animationEnabled = Boolean(animation && animation.scale > 0);
  const displacementScale = animation ? mapRange(animation.scale, 1, 100, 20, 100) : 0;
  const animationDuration = animation ? mapRange(animation.speed, 1, 100, 1000, 50) : 1;

  useEffect(() => {
    if (!colorMatrixRef.current || !animationEnabled) return;
    animationRef.current?.stop();
    hueRotate.set(0);
    animationRef.current = animate(hueRotate, 360, {
      duration: animationDuration / 25,
      repeat: Infinity,
      repeatType: "loop",
      ease: "linear",
      onUpdate: (value) => colorMatrixRef.current?.setAttribute("values", String(value)),
    });
    return () => animationRef.current?.stop();
  }, [animationDuration, animationEnabled, hueRotate]);

  return (
    <div className={className} style={{ overflow: "hidden", position: "relative", width: "100%", height: "100%", ...style }} aria-hidden="true">
      <div style={{ position: "absolute", inset: -displacementScale, filter: animationEnabled ? `url(#${id}) blur(4px)` : "none" }}>
        {animationEnabled && (
          <svg className="absolute h-0 w-0" aria-hidden="true">
            <defs>
              <filter id={id}>
                <feTurbulence
                  result="undulation"
                  numOctaves="2"
                  baseFrequency={`${mapRange(animation!.scale, 0, 100, 0.001, 0.0005)},${mapRange(animation!.scale, 0, 100, 0.004, 0.002)}`}
                  seed="0"
                  type="turbulence"
                />
                <feColorMatrix ref={colorMatrixRef} in="undulation" type="hueRotate" values="180" />
                <feColorMatrix in="undulation" result="circulation" type="matrix" values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0" />
                <feDisplacementMap in="SourceGraphic" in2="circulation" scale={displacementScale} result="dist" />
                <feDisplacementMap in="dist" in2="undulation" scale={displacementScale} result="output" />
              </filter>
            </defs>
          </svg>
        )}
        <div
          className="h-full w-full"
          style={{
            backgroundColor: color,
            maskImage: maskUrl,
            WebkitMaskImage: maskUrl,
            maskSize: sizing === "stretch" ? "100% 100%" : "cover",
            WebkitMaskSize: sizing === "stretch" ? "100% 100%" : "cover",
            maskRepeat: "no-repeat",
            maskPosition: "center",
          }}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: color,
          backgroundImage: maskUrl,
          backgroundSize: sizing === "stretch" ? "100% 100%" : "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundBlendMode: "screen",
          filter: "blur(8px)",
          opacity: 0.42,
        }}
      />
      {noise && noise.opacity > 0 && (
        <div className="absolute inset-0" style={{ backgroundImage: noiseUrl, backgroundSize: noise.scale * 200, backgroundRepeat: "repeat", opacity: noise.opacity / 2 }} />
      )}
    </div>
  );
}
