"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShortCodeEntry } from "../../components/receiver/ShortCodeEntry";

export default function PairPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handlePair = async (code: string) => {
    setLoading(true);
    setError(undefined);

    try {
      // Validate short code with local gateway endpoint
      const res = await fetch(`/api/pair?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        router.push("/receiver");
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "Invalid or expired pair code.");
      }
    } catch {
      setError("Failed to connect to Relay Gateway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-white">
      <ShortCodeEntry
        onSubmit={handlePair}
        isLoading={loading}
        errorMessage={error}
      />
    </main>
  );
}
