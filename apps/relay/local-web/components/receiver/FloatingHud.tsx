"use client";

import { useState } from "react";

export interface FloatingHudProps {
  isConnected: boolean;
  latencyMs: number;
  errorCount: number;
  isConsoleOpen: boolean;
  onToggleConsole: () => void;
  onReload: () => void;
  onToggleOrientation: () => void;
  isLandscape: boolean;
}

export function FloatingHud({
  isConnected,
  latencyMs,
  errorCount,
  isConsoleOpen,
  onToggleConsole,
  onReload,
  onToggleOrientation,
  isLandscape,
}: FloatingHudProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 transition-all select-none">
      <div className="flex items-center gap-2 p-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 rounded-full shadow-2xl text-xs font-mono text-zinc-300">
        {/* Connection status indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"
                : "bg-rose-500"
            }`}
          />
          <span className="font-semibold">{latencyMs}ms</span>
        </div>

        {isExpanded && (
          <>
            <div className="w-[1px] h-4 bg-zinc-700" />

            {/* Reload button */}
            <button
              type="button"
              onClick={onReload}
              className="p-1.5 hover:bg-zinc-800 rounded-full transition-colors text-zinc-300 hover:text-white"
              title="Reload Frame"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Reload frame"
              >
                <title>Reload</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* Rotate orientation button */}
            <button
              type="button"
              onClick={onToggleOrientation}
              className={`p-1.5 hover:bg-zinc-800 rounded-full transition-colors ${
                isLandscape ? "text-emerald-400" : "text-zinc-300"
              }`}
              title="Toggle Orientation"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Toggle orientation"
              >
                <title>Orientation</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>

            {/* Console drawer toggle button */}
            <button
              type="button"
              onClick={onToggleConsole}
              className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                isConsoleOpen
                  ? "bg-zinc-800 text-white"
                  : "hover:bg-zinc-800 text-zinc-300"
              }`}
            >
              <span>Logs</span>
              {errorCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 font-bold rounded-full text-[10px]">
                  {errorCount}
                </span>
              )}
            </button>
          </>
        )}

        {/* Expand / Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
          aria-label={isExpanded ? "Collapse HUD" : "Expand HUD"}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            role="img"
            aria-label="Toggle menu"
          >
            <title>Toggle</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
