"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { Dots } from "./Dots";

type TabId = "devices" | "console" | "network" | "actions";

const TABS: { id: TabId; label: string; badge?: string }[] = [
  { id: "devices", label: "Devices", badge: "3" },
  { id: "console", label: "Console", badge: "2" },
  { id: "network", label: "Network", badge: "1" },
  { id: "actions", label: "Actions" },
];

const DEVICES = [
  {
    name: "Samsung S25",
    meta: "Android · Chrome 151",
    size: "412 × 915",
    state: "active",
  },
  {
    name: "iPad Air",
    meta: "iPadOS · Safari 19",
    size: "820 × 1180",
    state: "active",
  },
  {
    name: "ThinkPad T14",
    meta: "Linux · Firefox 145",
    size: "1920 × 1080",
    state: "idle",
  },
];

const CONSOLE = [
  {
    level: "warn" as const,
    text: "Image with src /hero.png has no width or height",
  },
  {
    level: "error" as const,
    text: "TypeError: Cannot read properties of undefined (reading 'id')",
  },
];

const NETWORK = [
  { method: "GET", path: "/api/session", status: 200, ms: "31ms" },
  { method: "GET", path: "/api/user", status: 500, ms: "28ms" },
  { method: "POST", path: "/api/events", status: 204, ms: "12ms" },
];

const ACTIONS = [
  "Reload",
  "Navigate",
  "Sync route",
  "Screenshot",
  "Report bug",
  "Open in browser",
];

/**
 * Believable Relay session UI. Desktop shows the panel in two columns;
 * mobile collapses it into the same tabbed interface, no layout stacking.
 */
export function SessionPanel() {
  const id = useId();
  const [active, setActive] = useState<TabId>("devices");
  const activeIndex = TABS.findIndex((t) => t.id === active);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = TABS.length - 1;
    let next = activeIndex;
    if (e.key === "ArrowRight")
      next = activeIndex === last ? 0 : activeIndex + 1;
    else if (e.key === "ArrowLeft")
      next = activeIndex === 0 ? last : activeIndex - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    const target = TABS[next];
    if (!target) return;
    setActive(target.id);
    document.getElementById(`${id}-tab-${target.id}`)?.focus();
  };

  return (
    <div className="border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <div className="flex items-center gap-3">
          <Dots size="sm" active />
          <p className="font-mono text-sm">localhost:3000</p>
        </div>
        <p className="label">
          <span className="text-ok">●</span> Simulated session · 3 devices ·
          00:14:22
        </p>
      </div>

      <div className="grid md:grid-cols-[15rem_1fr]">
        <div
          role="tablist"
          aria-label="Session panels"
          aria-orientation="vertical"
          onKeyDown={onKeyDown}
          className="flex overflow-x-auto border-b border-rule md:flex-col md:overflow-visible md:border-r md:border-b-0"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`${id}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={active === tab.id}
              aria-controls={`${id}-panel-${tab.id}`}
              tabIndex={active === tab.id ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cn(
                "relative flex min-h-11 shrink-0 items-center justify-between gap-3 px-4 text-sm transition-colors md:border-b md:border-rule",
                active === tab.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{tab.label}</span>
              {tab.badge && <span className="label">{tab.badge}</span>}
              {active === tab.id && (
                <span
                  aria-hidden="true"
                  className="spectrum-bg absolute inset-y-0 left-0 hidden w-px md:block"
                />
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[19rem] p-4">
          <Panel
            id={`${id}-panel-devices`}
            labelledBy={`${id}-tab-devices`}
            show={active === "devices"}
          >
            <ul className="space-y-px">
              {DEVICES.map((d) => (
                <li
                  key={d.name}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-rule py-3"
                >
                  <div>
                    <p className="text-sm">{d.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {d.meta}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-muted-foreground">
                      {d.size}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[0.6875rem] tracking-[0.12em] uppercase",
                        d.state === "active"
                          ? "text-ok"
                          : "text-muted-foreground",
                      )}
                    >
                      {d.state}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            id={`${id}-panel-console`}
            labelledBy={`${id}-tab-console`}
            show={active === "console"}
          >
            <p className="label mb-3">
              Captured from the paired device — this is the tested app&rsquo;s
              own output, not Relay
            </p>
            <ul className="space-y-px font-mono text-[0.8125rem]">
              {CONSOLE.map((c) => (
                <li
                  key={c.text}
                  className="flex gap-3 border-b border-rule py-3"
                >
                  <span
                    className={cn(
                      "shrink-0 text-[0.6875rem] tracking-[0.12em] uppercase",
                      c.level === "error" ? "text-destructive" : "text-warn",
                    )}
                  >
                    {c.level}
                  </span>
                  <span className="min-w-0 break-words text-muted-foreground">
                    {c.text}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Example output from a demo app running on a paired phone. Relay
              forwards what your app logs, so you can read a mobile-only error
              without picking up the device.
            </p>
          </Panel>

          <Panel
            id={`${id}-panel-network`}
            labelledBy={`${id}-tab-network`}
            show={active === "network"}
          >
            <table className="w-full font-mono text-[0.8125rem]">
              <caption className="label mb-3 text-left">
                Example requests captured from the paired device
              </caption>
              <thead>
                <tr className="border-b border-rule text-left">
                  <th scope="col" className="label pb-2 font-normal">
                    Method
                  </th>
                  <th scope="col" className="label pb-2 font-normal">
                    Path
                  </th>
                  <th scope="col" className="label pb-2 font-normal">
                    Status
                  </th>
                  <th scope="col" className="label pb-2 text-right font-normal">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {NETWORK.map((r) => (
                  <tr key={r.path} className="border-b border-rule">
                    <td className="py-2.5 text-muted-foreground">{r.method}</td>
                    <td className="py-2.5">{r.path}</td>
                    <td
                      className={cn(
                        "py-2.5",
                        r.status >= 400 ? "text-destructive" : "text-ok",
                      )}
                    >
                      {r.status} {r.status >= 400 ? "failed" : "ok"}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {r.ms}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel
            id={`${id}-panel-actions`}
            labelledBy={`${id}-tab-actions`}
            show={active === "actions"}
          >
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="min-h-11 border border-border px-4 text-sm text-muted-foreground transition-colors hover:border-input hover:text-foreground"
                >
                  {a}
                </button>
              ))}
            </div>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Actions run against every attached device, or one at a time. Relay
              stops at the controls you actually need — it is not a second set
              of developer tools.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({
  id,
  labelledBy,
  show,
  children,
}: {
  id: string;
  labelledBy: string;
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <div role="tabpanel" id={id} aria-labelledby={labelledBy} hidden={!show}>
      {show && children}
    </div>
  );
}
