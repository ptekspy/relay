"use client";

import Link from "next/link";
import { useState } from "react";
import {
  type MetricPoint,
  SessionMetricsChart,
} from "@/components/dashboard/SessionMetricsChart";

interface SessionItem {
  id: string;
  shortCode: string;
  targetPort: number;
  status: "active" | "stale" | "closed";
  receiversCount: number;
  createdAt: number;
  telemetry: MetricPoint[];
}

const INITIAL_SESSIONS: SessionItem[] = [
  {
    id: "ses_live_alpha9",
    shortCode: "4B7Z9X",
    targetPort: 3000,
    status: "active",
    receiversCount: 2,
    createdAt: Date.now() - 1200000,
    telemetry: [
      { timestamp: 1, latencyMs: 24, throughputKb: 340 },
      { timestamp: 2, latencyMs: 18, throughputKb: 512 },
      { timestamp: 3, latencyMs: 31, throughputKb: 280 },
      { timestamp: 4, latencyMs: 22, throughputKb: 490 },
      { timestamp: 5, latencyMs: 19, throughputKb: 430 },
    ],
  },
  {
    id: "ses_staging_beta2",
    shortCode: "9K2M4P",
    targetPort: 8080,
    status: "active",
    receiversCount: 1,
    createdAt: Date.now() - 3600000,
    telemetry: [
      { timestamp: 1, latencyMs: 45, throughputKb: 120 },
      { timestamp: 2, latencyMs: 52, throughputKb: 150 },
      { timestamp: 3, latencyMs: 39, throughputKb: 140 },
    ],
  },
];

export default function SessionsDashboardPage() {
  const [sessions, setSessions] = useState<SessionItem[]>(INITIAL_SESSIONS);

  const terminateSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "closed" as const } : s)),
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Active Sessions
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Monitor and manage live tunnels connected to your team&apos;s dev
            servers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {sessions.filter((s) => s.status === "active").length} Live Now
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`border rounded-xl p-5 bg-zinc-950 flex flex-col justify-between transition-all ${
              session.status === "active"
                ? "border-zinc-800 hover:border-zinc-700"
                : "border-zinc-900 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-white tracking-wider">
                      {session.shortCode}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                        session.status === "active"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono mt-1">
                    Port: :{session.targetPort} • ID: {session.id}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-zinc-300">
                    {session.receiversCount} Receiver
                    {session.receiversCount === 1 ? "" : "s"}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {Math.round((Date.now() - session.createdAt) / 60000)}m
                    uptime
                  </div>
                </div>
              </div>

              <div className="my-4">
                <SessionMetricsChart data={session.telemetry} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-900 mt-2">
              <div className="flex items-center gap-2">
                <Link
                  href={`/view/${session.id}`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Launch Viewer
                </Link>
                <Link
                  href={`/manage/${session.id}?code=${session.shortCode}&port=${session.targetPort}`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors border border-zinc-700"
                >
                  Manage Session
                </Link>
              </div>

              {session.status === "active" && (
                <button
                  type="button"
                  onClick={() => terminateSession(session.id)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950 hover:text-rose-400 border border-zinc-800 text-zinc-400 transition-colors"
                >
                  Kill Session
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
