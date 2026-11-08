import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] items-center py-20">
      <div className="max-w-md">
        <p className="label">404 — no route</p>
        <h1 className="mt-4 text-3xl font-medium tracking-tight">
          This page isn't paired.
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page you asked for doesn't exist. The docs are probably where you
          were heading.
        </p>
        <div className="mt-6 flex gap-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center border border-input px-4 text-sm transition-colors hover:bg-secondary"
          >
            Home
          </Link>
          <Link
            href="/docs"
            className="inline-flex min-h-11 items-center border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Docs
          </Link>
        </div>
      </div>
    </div>
  );
}
