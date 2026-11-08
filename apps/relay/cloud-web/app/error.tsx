"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);
  return (
    <div className="shell flex min-h-[60vh] items-center py-20">
      <div className="max-w-md">
        <p className="label">error</p>
        <h1 className="mt-4 text-2xl font-medium tracking-tight">
          This page didn't load.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong on our end. Try again, or head back home.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              retry();
            }}
            className="inline-flex min-h-11 items-center border border-input px-4 text-sm transition-colors hover:bg-secondary"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex min-h-11 items-center border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
