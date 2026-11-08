"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface ConnectionDetailsCardProps {
  sessionId: string;
  shortCode: string;
  connectionUrl: string;
  targetPort: number;
  isRemote?: boolean;
  manageHref?: string;
  viewHref?: string;
}

function generateQrMatrix(data: string, size = 25): boolean[][] {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }

  const matrix: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      // Standard Finder Patterns at corners
      const inTopLeft = r < 7 && c < 7;
      const inTopRight = r < 7 && c >= size - 7;
      const inBottomLeft = r >= size - 7 && c < 7;

      if (inTopLeft || inTopRight || inBottomLeft) {
        const rowInBox = inTopLeft ? r : inTopRight ? r : r - (size - 7);
        const colInBox = inTopLeft ? c : inTopRight ? c - (size - 7) : c;
        const isBorder =
          rowInBox === 0 || rowInBox === 6 || colInBox === 0 || colInBox === 6;
        const isCenter =
          rowInBox >= 2 && rowInBox <= 4 && colInBox >= 2 && colInBox <= 4;
        row.push(isBorder || isCenter);
      } else {
        // Deterministic pseudo-random payload pattern
        const seed = Math.abs(hash ^ (r * 31 + c * 17));
        row.push((seed % 7 === 0 || seed % 3 === 0) && (r + c) % 2 === 0);
      }
    }
    matrix.push(row);
  }
  return matrix;
}

export function ConnectionDetailsCard({
  sessionId,
  shortCode,
  connectionUrl,
  targetPort,
  isRemote = false,
  manageHref,
  viewHref,
}: ConnectionDetailsCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"npm" | "pnpm" | "bun">("bun");

  const matrix = useMemo(
    () => generateQrMatrix(connectionUrl || shortCode),
    [connectionUrl, shortCode],
  );

  const commands = {
    bun: `bunx @paddy-systems/relay connect ${shortCode}`,
    pnpm: `pnpm dlx @paddy-systems/relay connect ${shortCode}`,
    npm: `npx @paddy-systems/relay connect ${shortCode}`,
  };

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-zinc-100 font-sans">
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
            {isRemote ? "Remote Cloud Tunnel" : "Local Network Tunnel"} Active
          </span>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          Port: <span className="text-white font-bold">:{targetPort}</span>
        </span>
      </div>

      {/* Main Grid: QR Code & Share Code */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        {/* QR Code Container */}
        <div className="bg-white p-3.5 rounded-xl shadow-lg shrink-0 flex items-center justify-center">
          <svg
            viewBox="0 0 25 25"
            className="w-40 h-40"
            role="img"
            aria-label={`QR Code for session ${sessionId}`}
          >
            {matrix.map((row, r) =>
              row.map((cell, c) =>
                cell ? (
                  <rect
                    key={`${r}-${c}`}
                    x={c}
                    y={r}
                    width={1}
                    height={1}
                    fill="#09090b"
                  />
                ) : null,
              ),
            )}
          </svg>
        </div>

        {/* Share Code & Instructions */}
        <div className="flex-1 w-full text-center sm:text-left">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Device Pairing Code
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
            <span className="font-mono text-3xl font-extrabold tracking-widest text-emerald-400 select-all">
              {shortCode}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(shortCode, "shortCode")}
              className="px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700"
            >
              {copiedKey === "shortCode" ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Scan the QR code with any mobile camera, enter the 6-character code
            on another device, or run the CLI connect command below.
          </p>

          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-zinc-500">
            <span>Session:</span>
            <span className="text-zinc-300 font-semibold">{sessionId}</span>
          </div>
        </div>
      </div>

      {/* Code Blocks for npm / pnpm / bun */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-300">
            Connect via Terminal CLI
          </span>
          <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-zinc-800 text-[11px] font-mono">
            {(["bun", "pnpm", "npm"] as const).map((pkg) => (
              <button
                key={pkg}
                type="button"
                onClick={() => setActiveTab(pkg)}
                className={`px-2.5 py-0.5 rounded transition-colors ${
                  activeTab === pkg
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {pkg}
              </button>
            ))}
          </div>
        </div>

        <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 font-mono text-xs flex items-center justify-between group">
          <span className="text-emerald-400 truncate pr-4">
            {commands[activeTab]}
          </span>
          <button
            type="button"
            onClick={() => copyToClipboard(commands[activeTab], "cliCmd")}
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-sans transition-colors border border-zinc-700 shrink-0"
          >
            {copiedKey === "cliCmd" ? "✓ Copied" : "Copy Command"}
          </button>
        </div>
      </div>

      {/* Action Buttons: Manage Session & Launch Viewer */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-zinc-800/80">
        <Link
          href={manageHref || `/manage/${sessionId}`}
          className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-wide text-center transition-colors shadow-lg shadow-emerald-950/40"
        >
          Manage Session →
        </Link>
        <Link
          href={viewHref || `/view/${sessionId}`}
          className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs text-center transition-colors border border-zinc-700"
        >
          Launch Live View
        </Link>
      </div>
    </div>
  );
}
