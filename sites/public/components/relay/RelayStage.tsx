"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Dots } from "./Dots";

/**
 * The above-the-fold stage: one terminal + QR block in the middle, patchwork of
 * devices around it. Each device arrives, scans the QR, then loads the same
 * skeleton app at its own viewport. The button cascades every device off screen
 * and starts the session again.
 */

type Kind = "phone" | "tablet" | "browser";

/** tile footprint in grid cells: columns × rows */
type Shape = "1x1" | "2x1" | "1x2" | "2x2" | "3x2";

const SHAPE_CLASS: Record<Shape, string> = {
  "1x1": "col-span-1 row-span-1",
  "2x1": "col-span-2 row-span-1",
  "1x2": "col-span-1 row-span-2",
  "2x2": "col-span-2 row-span-2",
  "3x2": "col-span-2 row-span-2 lg:col-span-3",
};

type Slot = {
  id: string;
  kind: Kind;
  label: string;
  vp: string;
  shape: Shape;
  delay: number; // seconds
};

const PAIR_CODE = "R-7K4P-92MX";

const POOL: Omit<Slot, "id" | "delay">[] = [
  { kind: "phone", label: "iPhone 15", vp: "393×852", shape: "1x2" },
  { kind: "browser", label: "MacBook Pro", vp: "1440×900", shape: "3x2" },
  { kind: "phone", label: "Pixel 8", vp: "412×915", shape: "1x1" },
  { kind: "tablet", label: "iPad mini", vp: "744×1133", shape: "2x2" },
  { kind: "phone", label: "SE 2020", vp: "375×667", shape: "1x1" },
  { kind: "browser", label: "ThinkPad", vp: "1366×768", shape: "2x1" },
  { kind: "phone", label: "Galaxy S22", vp: "360×780", shape: "1x2" },
  { kind: "tablet", label: "Tab S9", vp: "800×1280", shape: "1x2" },
  { kind: "phone", label: "Nothing 2a", vp: "393×873", shape: "1x1" },
  { kind: "browser", label: "Studio Display", vp: "1600×900", shape: "2x2" },
  { kind: "phone", label: "iPhone 12", vp: "390×844", shape: "1x1" },
  { kind: "tablet", label: "Fire HD", vp: "800×1280", shape: "2x1" },
  { kind: "phone", label: "Moto G84", vp: "393×873", shape: "1x2" },
  { kind: "browser", label: "Windows 11", vp: "1280×800", shape: "3x2" },
  { kind: "phone", label: "iPhone 15 Pro", vp: "393×852", shape: "1x1" },
  { kind: "tablet", label: "iPad Pro", vp: "1024×1366", shape: "2x2" },
  { kind: "phone", label: "Zenfone 10", vp: "412×915", shape: "1x1" },
  { kind: "browser", label: "Chromebook", vp: "1366×768", shape: "2x1" },
  { kind: "phone", label: "Xperia 5", vp: "360×800", shape: "1x2" },
  { kind: "tablet", label: "Surface Go", vp: "1024×768", shape: "2x1" },
  { kind: "phone", label: "iPhone 13 mini", vp: "375×812", shape: "1x1" },
  { kind: "browser", label: "iMac 24", vp: "1920×1080", shape: "2x2" },
  { kind: "phone", label: "Redmi Note 13", vp: "393×873", shape: "1x1" },
  { kind: "tablet", label: "Galaxy Tab A9", vp: "800×1280", shape: "1x2" },
];

/** Enough devices to fill the viewport around the panel, arriving in a fast wave. */
const SLOTS: Slot[] = Array.from({ length: 34 }, (_, i) => {
  const base = POOL.at(i % POOL.length);
  if (!base) throw new Error("Relay device pool must not be empty");
  return {
    ...base,
    id: `d${String(i + 1).padStart(2, "0")}`,
    delay: 0.15 + i * 0.13,
  };
});

type Phase = "waiting" | "arrive" | "scan" | "load" | "live";

function phaseFor(t: number, delay: number): Phase {
  const e = t - delay;
  if (e < 0) return "waiting";
  if (e < 0.5) return "arrive";
  if (e < 1.9) return "scan";
  if (e < 2.7) return "load";
  return "live";
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/* ---------------- QR ---------------- */

function qrCells(size = 21) {
  const cells: { id: string; on: boolean }[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // finder squares in three corners
      const finder = (fx: number, fy: number) => {
        const dx = x - fx;
        const dy = y - fy;
        if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
        const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        return ring === 3 || ring <= 1;
      };
      const f = finder(0, 0) ?? finder(size - 7, 0) ?? finder(0, size - 7);
      if (f !== null) {
        cells.push({ id: `${x}-${y}`, on: f });
        continue;
      }
      const n = (x * 73856093) ^ (y * 19349663) ^ ((x * y) << 3);
      cells.push({ id: `${x}-${y}`, on: ((n >>> 4) & 7) > 3 });
    }
  }
  return cells;
}

function QrCode({
  className,
  cell = 4,
  quiet = 2,
}: {
  className?: string;
  cell?: number;
  quiet?: number;
}) {
  const cells = useMemo(() => qrCells(21), []);
  return (
    <div
      aria-hidden="true"
      className={cn("inline-grid bg-foreground", className)}
      style={{ gridTemplateColumns: `repeat(21, ${cell}px)`, padding: quiet }}
    >
      {cells.map((qrCell) => (
        <span
          key={qrCell.id}
          style={{ width: cell, height: cell }}
          className={qrCell.on ? "bg-background" : "bg-foreground"}
        />
      ))}
    </div>
  );
}

/* ---------------- Skeleton app ---------------- */

function SkeletonApp({ kind, dim }: { kind: Kind; dim?: boolean }) {
  const wide = kind === "browser";
  const rows = kind === "phone" ? 9 : wide ? 5 : 8;
  const summaryCards = wide
    ? ["summary-primary", "summary-secondary", "summary-tertiary"]
    : ["summary-primary", "summary-secondary"];
  const activityRows = Array.from({ length: rows }, (_, position) => ({
    id: `activity-row-${position + 1}`,
    opacity: 1 - position * 0.06,
    width: 52 + ((position * 37) % 42),
  }));
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-[3px] bg-[oklch(0.13_0.02_278)] p-[5px] transition-opacity duration-500",
        dim ? "opacity-40" : "opacity-100",
      )}
    >
      <div className="flex items-center gap-[3px]">
        <span className="block size-[3px] bg-blue" />
        <span className="block size-[3px] bg-violet" />
        <span className="block size-[3px] bg-magenta" />
        <span className="ml-auto block h-[3px] w-[10px] bg-foreground/25" />
      </div>
      <div className="spectrum-bg h-[6px] w-[68%]" />
      <div className="h-[3px] w-[86%] bg-foreground/20" />
      <div
        className={cn("grid gap-[3px]", wide ? "grid-cols-3" : "grid-cols-2")}
      >
        {summaryCards.map((cardId) => (
          <div
            key={cardId}
            className="h-[12px] border border-foreground/15 bg-foreground/[0.04]"
          />
        ))}
      </div>
      <div className="mt-[2px] flex flex-1 flex-col gap-[3px] overflow-hidden">
        {activityRows.map((row) => (
          <div
            key={row.id}
            className="flex shrink-0 items-center gap-[3px]"
            style={{ opacity: row.opacity }}
          >
            <span className="block size-[3px] shrink-0 bg-violet/60" />
            <span
              className="block h-[3px] bg-foreground/15"
              style={{ width: `${row.width}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-[3px]">
        <div className="h-[6px] w-[20px] bg-blue/70" />
        <div className="h-[6px] w-[12px] border border-foreground/20" />
      </div>
    </div>
  );
}

/* ---------------- Device tile ---------------- */

function DeviceTile({
  slot,
  phase,
  cascade,
  index,
}: {
  slot: Slot;
  phase: Phase;
  cascade: boolean;
  index: number;
}) {
  const span = SHAPE_CLASS[slot.shape];

  const visible = phase !== "waiting";
  const style: React.CSSProperties = cascade
    ? {
        transform: `translateY(120vh) rotate(${index % 2 ? 14 : -14}deg)`,
        opacity: 0,
        transitionDelay: `${(index % 8) * 60}ms`,
      }
    : {
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(-14px) scale(0.92)",
        opacity: visible ? 1 : 0,
      };

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden border bg-background/85 transition-all duration-500 ease-out",
        phase === "scan"
          ? "border-magenta/70"
          : phase === "load"
            ? "border-violet/60"
            : "border-border",
        span,
      )}
      style={style}
    >
      <div className="flex items-center gap-1.5 border-b border-rule px-1.5 py-[4px]">
        <span
          className={cn(
            "block size-[4px] shrink-0",
            phase === "live"
              ? "bg-ok"
              : phase === "scan"
                ? "bg-magenta"
                : "bg-blue/80",
          )}
        />
        <span className="truncate font-mono text-[8px] tracking-tight text-foreground/70">
          {slot.label}
        </span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {phase === "scan" ? (
          <div className="flex h-full items-center justify-center bg-[oklch(0.11_0.02_278)]">
            <QrCode cell={1} className="p-[2px]" />
            <span className="scan-line pointer-events-none absolute inset-x-0 top-0 h-[2px]" />
          </div>
        ) : (
          <SkeletonApp kind={slot.kind} dim={phase === "load"} />
        )}
        {phase === "load" && (
          <span className="absolute inset-x-0 bottom-0 bg-violet/85 px-1 font-mono text-[7px] text-background">
            loading
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-1 border-t border-rule px-1.5 py-[3px] font-mono text-[7px] text-muted-foreground">
        <span className="truncate">{slot.vp}</span>
        <span>
          {phase === "live" ? ":3000" : phase === "scan" ? "pairing" : "…"}
        </span>
      </div>
    </div>
  );
}

/* ---------------- Terminal + QR block ---------------- */

function TerminalBlock({
  attached,
  cascade,
  live,
  onReplay,
}: {
  attached: number;
  cascade: boolean;
  live: boolean;
  onReplay?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden border border-input bg-[oklch(0.16_0.022_278)]",
        live
          ? "shadow-none"
          : "shadow-[0_0_0_1px_oklch(0.7_0.18_300/_20%),0_30px_80px_-20px_oklch(0_0_0/_80%)]",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2">
        <span className="label">relay session · simulated</span>
        <span className="flex items-center gap-2">
          <Dots size="sm" active />
          <span className="font-mono text-[0.625rem] tracking-[0.12em] uppercase text-muted-foreground">
            {live ? "live" : cascade ? "releasing" : "listening"}
          </span>
        </span>
      </div>

      <div className="grid flex-1 gap-px grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 p-3">
          <pre className="overflow-hidden font-mono text-[0.625rem] leading-5 sm:text-[0.75rem] sm:leading-6">
            <code>
              <span className="block">
                <span className="tok-prompt mr-2">$</span>
                <span className="tok-kw">pnpm</span> dev
              </span>
              <span className="block text-muted-foreground">
                ready — http://localhost:3000
              </span>
              <span className="mt-2 block">
                <span className="tok-prompt mr-2">$</span>
                <span className="tok-cmd">relay</span>{" "}
                <span className="tok-num">3000</span>
              </span>
              <span className="block text-muted-foreground">
                <span className="mr-2 text-ok">✓</span>gateway running on lan
              </span>
              <span className="block text-muted-foreground">
                <span className="mr-2 text-ok">✓</span>example access code{" "}
                {PAIR_CODE}
              </span>
              <span className="block text-muted-foreground">
                <span className="mr-2 text-ok">✓</span>
                {live
                  ? "session live — your app is on every paired device"
                  : cascade
                    ? "releasing devices…"
                    : `${attached} device${attached === 1 ? "" : "s"} attached`}
              </span>
            </code>
          </pre>
          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              className="mt-3 min-h-9 border border-border px-3 font-mono text-[0.625rem] tracking-[0.12em] uppercase text-muted-foreground transition-colors hover:border-input hover:text-foreground"
            >
              Replay demo
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 border-l border-rule p-2 sm:p-3">
          <div className="text-center">
            <QrCode cell={2} className="mx-auto sm:hidden" />
            <QrCode cell={3} className="mx-auto hidden sm:inline-grid" />

            <p className="mt-2 font-mono text-[0.5rem] tracking-[0.14em] sm:text-[0.6875rem]">
              {PAIR_CODE}
            </p>
            <p className="label mt-1">example code</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Stage ---------------- */

type Box = { left: number; top: number; width: number; height: number };

function boxOf(el: Element | null): Box | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

export const TERMINAL_SLOT_ID = "relay-terminal-slot";
const SEEN_KEY = "relay-intro-seen";

export function RelayStage({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  const [cascade, setCascade] = useState(false);
  /** true once the devices have cascaded away and the site beneath is revealed */
  const [opened, setOpened] = useState(false);
  /** true once the panel has settled into the page's own layout slot */
  const [docked, setDocked] = useState(false);
  /** nothing renders until we know whether this visitor has already seen the intro */
  const [ready, setReady] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  /** the reserved hole in the patchwork the panel occupies */
  const holeRef = useRef<HTMLDivElement | null>(null);

  const skipToPage = useCallback(() => {
    setCascade(true);
    setOpened(true);
    setDocked(true);
  }, []);

  /* returning visitors — and anyone who prefers reduced motion — skip the intro */
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen || reduced) skipToPage();
    setReady(true);
  }, [reduced, skipToPage]);

  const markSeen = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode — the intro simply plays again */
    }
  }, []);

  /* the panel follows the reserved hole, then the page's own slot */
  useEffect(() => {
    const measure = () => {
      const target = opened
        ? boxOf(document.getElementById(TERMINAL_SLOT_ID))
        : boxOf(holeRef.current);
      if (target) setBox(target);
    };
    measure();
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [opened]);

  useEffect(() => {
    if (reduced || docked) {
      setT(99);
      return;
    }
    start.current = performance.now();
    const tick = (now: number) => {
      setT((now - start.current) / 1000);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [reduced, docked]);

  /* lock the page while the stage covers it */
  useEffect(() => {
    if (opened) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [opened]);

  const startRelay = useCallback(() => {
    if (opened) return;
    markSeen();
    setCascade(true);
    /* devices fall away, then the panel travels into its place in the page */
    window.setTimeout(() => setOpened(true), 1200);
    window.setTimeout(() => setDocked(true), 2200);
  }, [opened, markSeen]);

  const skipIntro = useCallback(() => {
    markSeen();
    skipToPage();
  }, [markSeen, skipToPage]);

  const replayIntro = useCallback(() => {
    if (reduced) return;
    try {
      sessionStorage.removeItem(SEEN_KEY);
    } catch {
      /* nothing to clear */
    }
    setDocked(false);
    setOpened(false);
    setCascade(false);
    setT(0);
    start.current = performance.now();
  }, [reduced]);

  const stagedSlots = SLOTS.map((slot) => ({
    phase: phaseFor(t, slot.delay),
    slot,
  }));
  const attached = stagedSlots.filter(({ phase }) => phase === "live").length;

  if (!ready) return null;

  /* once settled, the panel is simply part of the page layout */
  if (docked) {
    const slot =
      typeof document === "undefined"
        ? null
        : document.getElementById(TERMINAL_SLOT_ID);
    if (slot) {
      return createPortal(
        <TerminalBlock
          attached={attached}
          cascade={false}
          live
          {...(reduced ? {} : { onReplay: replayIntro })}
        />,
        slot,
      );
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] transition-colors duration-700",
        opened ? "pointer-events-none bg-transparent" : "bg-background",
        className,
      )}
    >
      {/* the patchwork covers the whole viewport, over every heading and menu */}
      <div
        aria-hidden="true"
        className="pointer-events-none grid h-full grid-cols-4 gap-1.5 overflow-hidden p-2 sm:grid-cols-6 lg:grid-cols-12 md:p-4"
        style={{
          gridAutoFlow: "dense",
          gridTemplateRows: "repeat(8, calc((100% - 7 * 0.375rem) / 8))",
          gridAutoRows: "0px",
        }}
      >
        {!opened &&
          stagedSlots
            .slice(0, 14)
            .map(({ slot, phase }, i) => (
              <DeviceTile
                key={slot.id}
                slot={slot}
                phase={phase}
                cascade={cascade}
                index={i}
              />
            ))}

        {/* reserved hole: the patchwork tiles around the session panel */}
        <div
          ref={holeRef}
          className="col-span-4 row-span-3 row-start-4 sm:col-span-6 sm:col-start-1 sm:row-start-4 lg:col-span-6 lg:col-start-4 xl:col-span-6 xl:col-start-4"
        />

        {!opened &&
          stagedSlots
            .slice(14)
            .map(({ slot, phase }, i) => (
              <DeviceTile
                key={slot.id}
                slot={slot}
                phase={phase}
                cascade={cascade}
                index={i + 14}
              />
            ))}
      </div>

      {/* skip: always reachable, first thing in the tab order */}
      {!opened && (
        <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-3 py-3 md:px-5">
          <p className="label bg-background/80 px-2 py-1 text-muted-foreground">
            simulated Relay session
          </p>
          <button
            type="button"
            onClick={skipIntro}
            className="min-h-10 border border-input bg-background px-4 font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Skip intro
          </button>
        </div>
      )}

      {/* the panel: centred over the stage, then travelling into the page's own slot */}
      {box && (
        <div
          className="pointer-events-auto absolute transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
          }}
        >
          <TerminalBlock attached={attached} cascade={cascade} live={opened} />
        </div>
      )}

      {/* start */}
      {!opened && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 bg-[linear-gradient(to_top,var(--background)_10%,transparent)] px-4 pt-16 pb-6">
          <button
            type="button"
            onClick={startRelay}
            className="spectrum-bg pointer-events-auto inline-flex min-h-14 w-full max-w-xl items-center justify-center gap-3 px-8 text-sm font-extrabold tracking-[0.16em] uppercase text-background transition-transform hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            Start your Relay <span aria-hidden="true">→</span>
          </button>
          <p className="label text-muted-foreground">
            {cascade
              ? "releasing every device…"
              : `simulated · ${attached} of ${SLOTS.length} devices attached`}
          </p>
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {opened
          ? "Simulated session started. Devices released."
          : `Simulated Relay session listening with example access code ${PAIR_CODE}. ${attached} devices attached.`}
      </p>
    </div>
  );
}
