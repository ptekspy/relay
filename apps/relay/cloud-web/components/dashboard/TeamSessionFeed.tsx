"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { filterTeamSessions, type TeamSessionItem } from "@/lib/team-feed";

export interface TeamSessionFeedProps {
  initialSessions: TeamSessionItem[];
}

export function TeamSessionFeed({ initialSessions }: TeamSessionFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "idle">(
    "all",
  );

  const filtered = useMemo(() => {
    return filterTeamSessions(initialSessions, {
      searchQuery,
      status: statusFilter,
    });
  }, [initialSessions, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col gap-4 font-sans text-zinc-100">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search developer, branch, repo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-72 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Status:</span>
          {(["all", "live", "idle"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
                statusFilter === s
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Grid / Feed */}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
            No active team sessions matching criteria.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 transition hover:border-zinc-700"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-xs font-bold text-cyan-400">
                  {item.developerName.slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {item.developerName}
                    </span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="font-mono text-xs text-zinc-400">
                      {item.project}
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-300">
                      git:{item.branch}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                    <span>
                      Port:{" "}
                      <span className="font-mono text-zinc-300">
                        :{item.targetPort}
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      Receivers:{" "}
                      <span className="font-semibold text-cyan-400">
                        {item.activeReceivers}
                      </span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          item.status === "live"
                            ? "bg-emerald-400 animate-pulse"
                            : "bg-amber-400"
                        }`}
                      />
                      <span className="capitalize">{item.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/view/${item.id}`}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-cyan-400"
                >
                  Join Session
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
