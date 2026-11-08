"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import { InviteManager } from "@/lib/invite";

function qrCells(n: number) {
  const cells: boolean[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if ((r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)) {
        const inFinder =
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (r < 7 &&
            c >= n - 7 &&
            (r === 0 ||
              r === 6 ||
              c === n - 7 ||
              c === n - 1 ||
              (r >= 2 && r <= 4 && c >= n - 5 && c <= n - 3))) ||
          (r >= n - 7 &&
            c < 7 &&
            (r === n - 7 ||
              r === n - 1 ||
              c === 0 ||
              c === 6 ||
              (r >= n - 5 && r <= n - 3 && c >= 2 && c <= 4)));
        cells.push(inFinder);
      } else {
        cells.push((r * 3 + c * 7 + (r ^ c)) % 3 === 0);
      }
    }
  }
  return cells;
}

export default function InviteLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const invite = useMemo(() => InviteManager.decodeToken(token), [token]);
  const cells = useMemo(() => qrCells(21), []);

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100">
        <div className="max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <div className="text-rose-500 font-bold text-lg mb-2">
            Invalid Invitation
          </div>
          <p className="text-sm text-zinc-400 mb-6">
            This invitation link is malformed or corrupted. Please request a new
            invite from the session host.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
          >
            Return to Relay Home
          </Link>
        </div>
      </div>
    );
  }

  const expired = InviteManager.isExpired(invite.expiresAt);
  const remaining = InviteManager.formatRemainingTime(invite.expiresAt);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 font-sans text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              {"Paddy Systems // Relay"}
            </span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              expired
                ? "bg-rose-950 text-rose-400 border border-rose-800"
                : "bg-emerald-950 text-emerald-400 border border-emerald-800"
            }`}
          >
            {expired ? "Expired" : `Expires in ${remaining}`}
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-1">
            {invite.sessionName}
          </h1>
          <p className="text-xs text-zinc-400 mb-6">
            Invited by{" "}
            <strong className="text-zinc-200">{invite.inviter}</strong>
          </p>

          {/* QR Code Presentation */}
          <div className="mx-auto mb-6 flex flex-col items-center justify-center rounded-xl bg-white p-4 shadow-inner">
            <div
              role="img"
              aria-label="Scan to connect device"
              className="inline-grid bg-white p-1"
              style={{ gridTemplateColumns: "repeat(21, 8px)" }}
            >
              {cells.map((on, i) => (
                <span
                  key={i}
                  style={{ width: 8, height: 8 }}
                  className={on ? "bg-zinc-950" : "bg-white"}
                />
              ))}
            </div>
            <span className="mt-3 text-[11px] font-mono font-medium text-zinc-700">
              Scan with Relay Receiver or Camera
            </span>
          </div>

          {/* Short code banner */}
          <div className="mb-6 rounded-lg bg-zinc-950/60 p-3 border border-zinc-800">
            <span className="block text-[11px] text-zinc-400 uppercase tracking-wider">
              Pairing Short Code
            </span>
            <span className="font-mono text-2xl font-bold tracking-widest text-cyan-400">
              {invite.shortCode}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {!expired ? (
              <Link
                href={`/view/${invite.sessionId}`}
                className="w-full rounded-lg bg-cyan-500 py-3 text-center text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
              >
                Launch Web Inspection Viewer
              </Link>
            ) : (
              <div className="text-xs text-rose-400 font-medium">
                This invitation has expired. Contact {invite.inviter} for an
                updated magic link.
              </div>
            )}

            <Link
              href="/"
              className="w-full rounded-lg bg-zinc-800 py-2.5 text-center text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
