"use client";

import type React from "react";
import { useState } from "react";

export interface ShortCodeEntryProps {
  onSubmit: (code: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
}

export function ShortCodeEntry({
  onSubmit,
  isLoading = false,
  errorMessage,
}: ShortCodeEntryProps) {
  const [code, setCode] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow unambiguous alphanumeric characters, max 6, uppercase
    const filtered = e.target.value
      .toUpperCase()
      .replace(/[^A-HJ-NP-Z2-9]/g, "")
      .slice(0, 6);
    setCode(filtered);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  return (
    <div className="w-full max-w-sm p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-emerald-500/10 text-emerald-400">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          role="img"
          aria-label="Pairing icon"
        >
          <title>Pairing Icon</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-zinc-100 mb-1">Enter Pair Code</h2>
      <p className="text-sm text-zinc-400 mb-6">
        Type the 6-character short code displayed in your terminal.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={code}
            onChange={handleChange}
            placeholder="ABC234"
            disabled={isLoading}
            className="w-full text-center text-3xl font-mono font-bold tracking-widest px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          />
        </div>

        {errorMessage && (
          <p className="text-xs text-rose-400 font-medium">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={code.length !== 6 || isLoading}
          className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? "Connecting..." : "Pair Device"}
        </button>
      </form>
    </div>
  );
}
