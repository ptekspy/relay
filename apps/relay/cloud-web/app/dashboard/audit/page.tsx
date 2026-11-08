"use client";

import { useMemo, useState } from "react";

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  ip: string;
  sessionId: string;
  timestamp: string;
}

const INITIAL_AUDIT_LOGS: AuditEntry[] = [
  {
    id: "aud_01",
    action: "SESSION_CREATED",
    actor: "paddy@paddy-systems.com",
    ip: "192.168.1.100",
    sessionId: "ses_live_alpha9",
    timestamp: "10m ago",
  },
  {
    id: "aud_02",
    action: "RECEIVER_PAIRED",
    actor: "Lenovo Tab M9",
    ip: "192.168.1.145",
    sessionId: "ses_live_alpha9",
    timestamp: "8m ago",
  },
  {
    id: "aud_03",
    action: "SUSPICIOUS_PAIR_BLOCKED",
    actor: "Automated Runner",
    ip: "45.33.32.156",
    sessionId: "ses_live_alpha9",
    timestamp: "5m ago",
  },
  {
    id: "aud_04",
    action: "PAT_REVOKED",
    actor: "paddy@paddy-systems.com",
    ip: "192.168.1.100",
    sessionId: "system",
    timestamp: "2m ago",
  },
];

export default function AuditDashboardPage() {
  const [filter, setFilter] = useState("");

  const filteredLogs = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return INITIAL_AUDIT_LOGS;
    return INITIAL_AUDIT_LOGS.filter(
      (log) =>
        log.action.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.ip.toLowerCase().includes(q) ||
        log.sessionId.toLowerCase().includes(q),
    );
  }, [filter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Security Audit Log
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Immutable log of all authentication, connection, and session
            revocation events.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="search"
            placeholder="Filter logs by actor, action, IP..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
          />
        </div>
      </div>

      <div className="border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-900/60 text-xs uppercase font-semibold text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="py-3 px-4">Event</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">IP Address</th>
              <th className="py-3 px-4">Target Session</th>
              <th className="py-3 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 font-mono text-xs">
            {filteredLogs.map((entry) => (
              <tr key={entry.id} className="hover:bg-zinc-900/30">
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      entry.action.includes("BLOCKED")
                        ? "bg-rose-950 text-rose-400 border border-rose-800"
                        : entry.action.includes("REVOKED")
                          ? "bg-amber-950 text-amber-400 border border-amber-800"
                          : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    }`}
                  >
                    {entry.action}
                  </span>
                </td>
                <td className="py-3 px-4 font-sans text-white">
                  {entry.actor}
                </td>
                <td className="py-3 px-4 text-zinc-400">{entry.ip}</td>
                <td className="py-3 px-4 text-zinc-400">{entry.sessionId}</td>
                <td className="py-3 px-4 text-right text-zinc-500">
                  {entry.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
