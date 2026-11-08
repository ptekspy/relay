import type { ConsoleEvent } from "@paddy-systems/relay-protocol";
import { useState } from "react";

export interface ConsoleMirrorProps {
  logs: ConsoleEvent[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

export function ConsoleMirror({
  logs,
  isOpen,
  onClose,
  onClear,
}: ConsoleMirrorProps) {
  const [filter, setFilter] = useState<"all" | "error" | "warn">("all");

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filter === "error") return log.level === "error";
    if (filter === "warn") return log.level === "warn";
    return true;
  });

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 max-h-[50vh] flex flex-col bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 shadow-2xl font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <span className="font-bold text-zinc-200">
            Console Logs ({logs.length})
          </span>
          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2 py-0.5 rounded ${
                filter === "all" ? "bg-zinc-800 text-white" : "text-zinc-400"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter("warn")}
              className={`px-2 py-0.5 rounded ${
                filter === "warn"
                  ? "bg-amber-500/20 text-amber-300"
                  : "text-zinc-400"
              }`}
            >
              Warn
            </button>
            <button
              type="button"
              onClick={() => setFilter("error")}
              className={`px-2 py-0.5 rounded ${
                filter === "error"
                  ? "bg-rose-500/20 text-rose-300"
                  : "text-zinc-400"
              }`}
            >
              Error
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            aria-label="Close logs drawer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Close"
            >
              <title>Close</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Logs container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 select-text">
        {filteredLogs.length === 0 ? (
          <div className="text-zinc-500 py-6 text-center">
            No logs recorded yet.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            const isError = log.level === "error";
            const isWarn = log.level === "warn";

            return (
              <div
                key={`${log.timestamp}-${log.level}-${log.args[0] ?? ""}`}
                className={`p-2 rounded border leading-relaxed break-words ${
                  isError
                    ? "bg-rose-950/20 border-rose-900/40 text-rose-200"
                    : isWarn
                      ? "bg-amber-950/20 border-amber-900/40 text-amber-200"
                      : "bg-zinc-900/40 border-zinc-800/60 text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-[10px] text-zinc-500">
                  <span>{time}</span>
                  <span className="uppercase font-semibold tracking-wider">
                    {log.level}
                  </span>
                </div>
                <div className="font-mono">{log.args.join(" ")}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
