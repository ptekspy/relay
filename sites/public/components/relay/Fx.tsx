"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";

function withStableIds(values: string[], namespace: string) {
  const occurrences = new Map<string, number>();
  return values.map((value) => {
    const occurrence = occurrences.get(value) ?? 0;
    occurrences.set(value, occurrence + 1);
    return { id: `${namespace}-${value}-${occurrence}`, value };
  });
}

function doubledWithStableIds(values: string[], namespace: string) {
  return [
    ...withStableIds(values, `${namespace}-first`),
    ...withStableIds(values, `${namespace}-second`),
  ];
}

/** Fixed film grain + drifting spectral light behind the whole page. */
export function LightField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="aurora absolute -top-[25%] -left-[10%] size-[46rem] max-w-[130vw] rounded-full bg-blue/60" />
      <div className="aurora absolute top-[10%] -right-[15%] size-[38rem] max-w-[120vw] rounded-full bg-magenta/50 [animation-delay:-6s]" />
      <div className="aurora absolute bottom-[-10%] left-[30%] size-[32rem] max-w-[110vw] rounded-full bg-violet/50 [animation-delay:-11s]" />
      <div className="noise absolute inset-0" />
    </div>
  );
}

/**
 * Drifting nodes that link when they come near each other — a relay network
 * humming behind the hero. Decorative; skipped for reduced-motion users.
 */
export function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type Node = { x: number; y: number; vx: number; vy: number; hue: number };
    let nodes: Node[] = [];

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(80, Math.max(18, Math.round((w * h) / 24000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        hue: 250 + Math.random() * 100,
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!a) continue;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          if (!b) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 22000) {
            ctx.strokeStyle = `hsl(${a.hue} 90% 68% / ${(1 - d2 / 22000) * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = `hsl(${a.hue} 95% 72% / 0.6)`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };

    build();
    frame();
    window.addEventListener("resize", build);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 size-full opacity-70"
    />
  );
}

/** Infinite ticker of short technical phrases. Decorative. */
export function Marquee({
  items,
  reverse,
  className,
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
}) {
  const row = doubledWithStableIds(items, "marquee");
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden border-y border-rule bg-background py-3",
        className,
      )}
    >
      <div className={reverse ? "marquee-track-rev" : "marquee-track"}>
        {row.map((item, i) => (
          <span
            key={item.id}
            className="label flex items-center px-6 text-foreground/75"
          >
            <span
              className={cn(
                "mr-6 block size-[6px]",
                i % 3 === 0
                  ? "bg-blue"
                  : i % 3 === 1
                    ? "bg-violet"
                    : "bg-magenta",
              )}
            />
            {item.value}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Full-bleed kinetic type band: two enormous counter-scrolling rows, one
 * gradient-filled and one hollow, tilted off the horizontal. Decorative.
 */
export function KineticBand({
  words,
  tilt = "-2deg",
  className,
}: {
  words: string[];
  tilt?: string;
  className?: string;
}) {
  const row = doubledWithStableIds(words, "kinetic-band");
  const Row = ({
    hollow,
    reverse,
  }: {
    hollow?: boolean;
    reverse?: boolean;
  }) => (
    <div className={reverse ? "marquee-track-rev" : "marquee-track"}>
      {row.map((word) => (
        <span
          key={word.id}
          className={cn(
            "display-mega flex items-center px-6 leading-none",
            hollow ? "stroke-text-spectrum" : "spectrum-text",
          )}
        >
          {word.value}
          <span
            aria-hidden="true"
            className="ml-8 block size-3 shrink-0 bg-magenta sm:size-4"
          />
        </span>
      ))}
    </div>
  );
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative isolate overflow-hidden py-6 sm:py-10",
        className,
      )}
      style={{ transform: `rotate(${tilt})` }}
    >
      <div className="beam pointer-events-none absolute inset-0 -z-10" />
      <Row />
      <Row hollow reverse />
    </div>
  );
}

/** Splits a headline into per-letter kinetic glyphs, keeping words intact. */
export function KineticHeadline({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  let index = 0;
  const words = withStableIds(text.split(" "), "headline-word");
  return (
    <span role="img" className={className} aria-label={text}>
      {words.map((word, wordPosition) => (
        <span
          key={word.id}
          aria-hidden="true"
          className="inline-block whitespace-nowrap"
        >
          {withStableIds(word.value.split(""), word.id).map((character) => (
            <span
              key={character.id}
              className="letter"
              style={{ "--i": index++ } as CSSProperties}
            >
              {character.value}
            </span>
          ))}
          {wordPosition < words.length - 1 ? "\u00a0" : ""}
        </span>
      ))}
    </span>
  );
}

/** Reveals its children the first time they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", shown && "reveal-in", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
