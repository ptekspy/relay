"use client";

import { GLOBAL_CONFIG } from "@paddy-systems/feature-flags/global";
import { cn } from "@paddy-systems/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dots, Wordmark } from "./Dots";

const NAV = [
  { to: "/", label: "Product", exact: true },
  { to: "/docs", label: "Docs", exact: false },
  { to: "/download", label: "Download", exact: false },
  { to: "/pricing", label: "Pricing", exact: false },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-background/85 backdrop-blur-xl">
      <div className="shell flex h-14 items-center justify-between gap-6">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Relay home"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  href={item.to}
                  className={`inline-flex min-h-9 items-center px-3 text-sm transition-colors hover:text-foreground ${
                    item.exact
                      ? pathname === item.to
                        ? "text-foreground"
                        : "text-muted-foreground"
                      : pathname.startsWith(item.to)
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="https://github.com/paddy-systems"
                className="inline-flex min-h-9 items-center px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {GLOBAL_CONFIG.AUTH_ENABLED && (
            <Link
              href="/sign-in"
              className="inline-flex min-h-9 items-center px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/download"
            className="inline-flex min-h-9 items-center gap-2 border border-input px-4 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            Get Relay
            <Dots size="sm" />
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center border border-border font-mono text-[0.6875rem] tracking-[0.12em] uppercase md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className={cn("border-t border-rule bg-background md:hidden")}
      >
        <nav aria-label="Primary mobile" className="shell py-3">
          <ul className="flex flex-col">
            {[...NAV].map((item, i) => (
              <li key={item.to} className="border-b border-rule">
                <Link
                  href={item.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center justify-between text-base"
                >
                  {item.label}
                  <span className="label">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </Link>
              </li>
            ))}
            <li className="border-b border-rule">
              <a
                href="https://github.com/paddy-systems"
                className="flex min-h-12 items-center justify-between text-base"
              >
                GitHub
                <span className="label">05</span>
              </a>
            </li>
          </ul>
          <div className="mt-4 flex gap-2">
            {GLOBAL_CONFIG.AUTH_ENABLED && (
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 flex-1 items-center justify-center border border-border text-sm"
              >
                Sign in
              </Link>
            )}
            <Link
              href="/download"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-input text-sm"
            >
              Get Relay <Dots size="sm" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
