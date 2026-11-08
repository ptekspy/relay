"use client";

import { cn } from "@paddy-systems/lib/cn";
import { useEffect, useState } from "react";
import { CopyButton } from "./Code";
import { Dots } from "./Dots";

const STEPS = [
  { text: "localhost:3000 reachable", ms: 700 },
  { text: "gateway running on lan", ms: 700 },
  { text: "ready for devices", ms: 700 },
] as const;

const PAIR_CODE = "R-7K4P-92MX";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * A simulated Relay session: the CLI starts, a pairing code is issued,
 * then a device attaches. Text content is real text, so screen readers
 * read the same story sighted users watch.
 */
export function HeroTerminal() {
  const reduced = usePrefersReducedMotion();
  const [stage, setStage] = useState(0); // 0 idle .. 5 connected
  const [_replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    if (reduced) {
      setStage(5);
      return;
    }
    setStage(0);
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (s: number, ms: number) =>
      timers.push(
        setTimeout(() => {
          if (!cancelled) setStage(s);
        }, ms),
      );
    schedule(1, 400);
    schedule(2, 1100);
    schedule(3, 1800);
    schedule(4, 2500);
    schedule(5, 4200);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduced]);

  const connected = stage >= 5;
  const waiting = stage === 4;

  return (
    <div className="border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2">
        <span className="label">relay session</span>
        <span className="flex items-center gap-2">
          <Dots size="sm" active={!connected && stage > 0} />
          <span
            className={cn(
              "font-mono text-[0.6875rem] tracking-[0.12em] uppercase",
              connected ? "text-ok" : "text-muted-foreground",
            )}
          >
            {connected ? "connected" : stage === 0 ? "idle" : "listening"}
          </span>
        </span>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        {/* Terminal */}
        <div className="border-b border-rule p-4 lg:border-r lg:border-b-0">
          <pre className="overflow-x-auto font-mono text-[0.8125rem] leading-7">
            <code>
              <span className="block">
                <span className="tok-prompt mr-2">$</span>
                <span className="tok-kw">pnpm</span> dev
              </span>
              <span className="block text-muted-foreground">
                ready — http://localhost:3000
              </span>
              <span className="mt-3 block">
                <span className="tok-prompt mr-2">$</span>
                <span className="tok-cmd">relay</span>{" "}
                <span className="tok-num">3000</span>
                {stage === 0 && !reduced && (
                  <span
                    aria-hidden="true"
                    className="ml-1 inline-block h-4 w-2 translate-y-0.5 bg-foreground"
                    style={{ animation: "relay-caret 1s step-end infinite" }}
                  />
                )}
              </span>
              {STEPS.map((step, i) => (
                <span
                  key={step.text}
                  className={cn(
                    "block transition-opacity",
                    stage > i ? "opacity-100" : "opacity-0",
                  )}
                >
                  <span className="mr-2 text-ok">✓</span>
                  <span className="text-muted-foreground">{step.text}</span>
                </span>
              ))}
            </code>
          </pre>
        </div>

        {/* Pairing / device */}
        <div className="flex flex-col justify-between gap-6 p-4">
          <div>
            <p className="label">{connected ? "device" : "pair device"}</p>
            {connected ? (
              <dl className="mt-3 space-y-2 text-sm animate-rise">
                <Row label="Name" value="Samsung S25" />
                <Row label="Browser" value="Chrome 151" />
                <Row label="Viewport" value="412 × 915" />
                <Row label="Route" value="/products/relay" mono />
              </dl>
            ) : (
              <div className="mt-3">
                <div className="flex items-center gap-3">
                  <p className="font-mono text-lg tracking-[0.14em]">
                    {PAIR_CODE}
                  </p>
                  <CopyButton value={PAIR_CODE} label="Copy" />
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Dots size="sm" active={waiting} />
                  {waiting ? "Waiting for device…" : "Issuing code…"}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-rule pt-3">
            <p className="label">
              {connected ? "1 device attached" : "0 devices"}
            </p>
            <button
              type="button"
              onClick={() => setReplayKey((k) => k + 1)}
              className="min-h-9 border border-border px-3 font-mono text-[0.6875rem] tracking-[0.12em] uppercase text-muted-foreground transition-colors hover:border-input hover:text-foreground"
            >
              Replay
            </button>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {connected
          ? "Relay connected. Samsung S25, Chrome 151, viewport 412 by 915, route /products/relay."
          : "Relay is listening and waiting for a device to pair with code R-7K4P-92MX."}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2 last:border-0">
      <dt className="label">{label}</dt>
      <dd className={cn("text-sm", mono && "font-mono text-[0.8125rem]")}>
        {value}
      </dd>
    </div>
  );
}
