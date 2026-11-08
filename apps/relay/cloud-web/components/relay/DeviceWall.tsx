"use client";

import { cn } from "@paddy-systems/lib/cn";
import { useEffect, useState } from "react";

/**
 * A wall of devices, all attached to the same Relay session, all mirroring the
 * same running app. Overwhelming through multiplicity: many screens, one localhost.
 */

type Kind = "phone" | "tablet" | "browser";

type Device = {
  id: string;
  kind: Kind;
  label: string;
  ua: string;
  span: string;
  delay: number;
};

const DEVICES: Device[] = [
  {
    id: "d01",
    kind: "phone",
    label: "iPhone 15",
    ua: "ios 17.4",
    span: "",
    delay: 0,
  },
  {
    id: "d02",
    kind: "browser",
    label: "MacBook Pro",
    ua: "safari 17",
    span: "sm:col-span-2",
    delay: 0.4,
  },
  {
    id: "d03",
    kind: "phone",
    label: "Pixel 8",
    ua: "android 14",
    span: "",
    delay: 0.8,
  },
  {
    id: "d04",
    kind: "tablet",
    label: "iPad mini",
    ua: "ipados 17",
    span: "",
    delay: 1.2,
  },
  {
    id: "d05",
    kind: "phone",
    label: "SE 2020",
    ua: "ios 16.7",
    span: "",
    delay: 1.6,
  },
  {
    id: "d06",
    kind: "browser",
    label: "ThinkPad",
    ua: "firefox 126",
    span: "sm:col-span-2",
    delay: 2.0,
  },
  {
    id: "d07",
    kind: "phone",
    label: "Galaxy S22",
    ua: "android 13",
    span: "",
    delay: 2.4,
  },
  {
    id: "d08",
    kind: "tablet",
    label: "Tab S9",
    ua: "android 14",
    span: "",
    delay: 2.8,
  },
  {
    id: "d09",
    kind: "phone",
    label: "Nothing 2a",
    ua: "android 14",
    span: "",
    delay: 3.2,
  },
  {
    id: "d10",
    kind: "browser",
    label: "Studio display",
    ua: "chrome 126",
    span: "sm:col-span-2",
    delay: 3.6,
  },
  {
    id: "d11",
    kind: "phone",
    label: "iPhone 12",
    ua: "ios 17.2",
    span: "",
    delay: 4.0,
  },
  {
    id: "d12",
    kind: "tablet",
    label: "Fire HD",
    ua: "silk 118",
    span: "",
    delay: 4.4,
  },
  {
    id: "d13",
    kind: "phone",
    label: "Moto G84",
    ua: "android 14",
    span: "",
    delay: 4.8,
  },
  {
    id: "d14",
    kind: "browser",
    label: "Windows 11",
    ua: "edge 126",
    span: "sm:col-span-2",
    delay: 5.2,
  },
  {
    id: "d15",
    kind: "phone",
    label: "iPhone 15 Pro",
    ua: "ios 17.5",
    span: "",
    delay: 5.6,
  },
  {
    id: "d16",
    kind: "tablet",
    label: "iPad Pro",
    ua: "ipados 17",
    span: "",
    delay: 6.0,
  },
  {
    id: "d17",
    kind: "phone",
    label: "Zenfone 10",
    ua: "android 14",
    span: "",
    delay: 6.4,
  },
  {
    id: "d18",
    kind: "browser",
    label: "Chromebook",
    ua: "chrome 125",
    span: "sm:col-span-2",
    delay: 6.8,
  },
  {
    id: "d19",
    kind: "phone",
    label: "Xperia 5",
    ua: "android 13",
    span: "",
    delay: 7.2,
  },
  {
    id: "d20",
    kind: "tablet",
    label: "Surface Go",
    ua: "edge 126",
    span: "",
    delay: 7.6,
  },
  {
    id: "d21",
    kind: "phone",
    label: "iPhone 13 mini",
    ua: "ios 17.1",
    span: "",
    delay: 8.0,
  },
  {
    id: "d22",
    kind: "browser",
    label: "iMac 24",
    ua: "safari 17",
    span: "sm:col-span-2",
    delay: 8.4,
  },
  {
    id: "d23",
    kind: "phone",
    label: "Redmi Note 13",
    ua: "android 14",
    span: "",
    delay: 8.8,
  },
  {
    id: "d24",
    kind: "tablet",
    label: "Galaxy Tab A9",
    ua: "android 14",
    span: "",
    delay: 9.2,
  },
];

/** The one app every device is showing. Identical in each frame, on purpose. */
function MirroredApp({ scale = 1 }: { scale?: number }) {
  return (
    <div className="flex h-full flex-col gap-[3px] bg-[oklch(0.13_0.02_278)] p-[5px]">
      <div className="flex items-center gap-[3px]">
        <span
          className="block size-[3px] bg-blue"
          style={{ transform: `scale(${scale})` }}
        />
        <span className="block size-[3px] bg-violet" />
        <span className="block size-[3px] bg-magenta" />
        <span className="ml-auto block h-[3px] w-[10px] bg-foreground/25" />
      </div>
      <div className="spectrum-bg h-[7px] w-[70%]" />
      <div className="h-[3px] w-[88%] bg-foreground/20" />
      <div className="h-[3px] w-[62%] bg-foreground/15" />
      <div className="mt-[2px] grid grid-cols-2 gap-[3px]">
        <div className="h-[13px] border border-foreground/15 bg-foreground/[0.04]" />
        <div className="h-[13px] border border-foreground/15 bg-foreground/[0.04]" />
      </div>
      <div className="mt-[3px] flex flex-1 flex-col gap-[3px] overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center gap-[3px]"
            style={{ opacity: 1 - i * 0.045 }}
          >
            <span className="block size-[3px] shrink-0 bg-violet/60" />
            <span
              className="block h-[3px] bg-foreground/15"
              style={{ width: `${52 + ((i * 37) % 42)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-[3px]">
        <div className="h-[7px] w-[22px] bg-blue/70" />
        <div className="h-[7px] w-[14px] border border-foreground/20" />
      </div>
    </div>
  );
}

function Frame({ device, hot }: { device: Device; hot: boolean }) {
  const { kind, label, ua, delay } = device;
  const aspect =
    kind === "phone"
      ? "aspect-[9/17]"
      : kind === "tablet"
        ? "aspect-[3/4]"
        : "aspect-[16/10]";

  return (
    <div
      className={cn(
        "group relative border border-border bg-background/85 backdrop-blur-[1px] transition-colors",
        hot ? "border-magenta/70" : "hover:border-violet/60",
        device.span,
      )}
    >
      {/* device chrome */}
      <div className="flex items-center gap-2 border-b border-rule px-2 py-[5px]">
        <span
          className={cn(
            "block size-[4px] shrink-0",
            hot ? "bg-magenta" : "bg-blue/80",
          )}
          style={{
            animation: `device-blink 3.2s ${delay}s infinite steps(1, end)`,
          }}
        />
        <span className="truncate font-mono text-[9px] tracking-tight text-foreground/70">
          {label}
        </span>
        <span className="ml-auto hidden font-mono text-[8px] text-muted-foreground sm:block">
          {ua}
        </span>
      </div>

      {/* screen */}
      <div className={cn("relative overflow-hidden", aspect)}>
        <MirroredApp />
        {/* reload sweep — every device reloads when the code changes */}
        <span
          aria-hidden="true"
          className="device-sweep pointer-events-none absolute inset-0"
          style={{ animationDelay: `${delay}s` }}
        />
        {hot && (
          <span className="absolute inset-x-0 bottom-0 bg-magenta/90 px-1 py-[1px] font-mono text-[8px] text-background">
            reloaded
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-rule px-2 py-[4px] font-mono text-[8px] text-muted-foreground">
        <span>:3000</span>
        <span>{device.id}</span>
      </div>
    </div>
  );
}

export function DeviceWall({ className }: { className?: string }) {
  const [hot, setHot] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;
    const t = window.setInterval(() => {
      setHot((n) => (n + 1) % DEVICES.length);
    }, 900);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div aria-hidden="true" className={cn("select-none", className)}>
      <div className="grid grid-cols-4 items-start gap-1.5 sm:grid-cols-6 lg:grid-cols-9 xl:grid-cols-12">
        {DEVICES.map((d, i) => (
          <Frame key={d.id} device={d} hot={i === hot} />
        ))}
      </div>
    </div>
  );
}

export { DEVICES };
