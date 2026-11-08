import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/relay/Code";
import { Dots } from "@/components/relay/Dots";
import { InstallCommand } from "@/components/relay/InstallCommand";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Download Relay — CLI and Android app",
  description:
    "Get the Relay CLI with npm, pnpm or bun, plus the Android app and browser pairing. Free for local use.",
  path: "/download",
});

const CLIENTS = [
  {
    name: "Relay CLI",
    meta: "npm · macOS, Linux, Windows",
    body: "The only required piece. Runs on the machine serving your app.",
    status: "Available",
  },
  {
    name: "Any browser",
    meta: "Chrome, Safari, Firefox, Edge",
    body: "Open the pairing page on the other device and enter the code. Nothing to install.",
    status: "Available",
  },
  {
    name: "Relay for Android",
    meta: "Android 10+",
    body: "Keeps sessions alive in the background and restores the last route on reconnect.",
    status: "Available",
  },
  {
    name: "Relay for iOS",
    meta: "iOS",
    body: "Safari pairing works today. A native app is being considered.",
    status: "Not yet",
  },
];

export default function Download() {
  return (
    <>
      <section className="border-b border-rule py-14 md:py-20">
        <div className="shell">
          <p className="label flex items-center gap-3">
            <Dots size="sm" /> Download
          </p>
          <h1 className="mt-6 max-w-2xl text-[2.25rem] leading-[1.08] font-medium tracking-tight md:text-[3rem]">
            One command is the whole install.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Relay is a CLI. Everything else — browsers, the Android app — is a
            way to join a session.
          </p>
          <InstallCommand className="mt-8 max-w-2xl" />
        </div>
      </section>

      <section className="py-14 md:py-20" aria-labelledby="clients">
        <div className="shell">
          <h2 id="clients" className="label">
            § 01 — Clients
          </h2>
          <ul className="mt-8 grid gap-px border border-border md:grid-cols-2">
            {CLIENTS.map((c) => (
              <li key={c.name} className="border-r border-b border-rule p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">{c.name}</h3>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {c.meta}
                    </p>
                  </div>
                  <span
                    className={
                      c.status === "Available"
                        ? "font-mono text-[0.6875rem] tracking-[0.12em] uppercase text-ok"
                        : "font-mono text-[0.6875rem] tracking-[0.12em] uppercase text-muted-foreground"
                    }
                  >
                    {c.status}
                  </span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="border-t border-rule py-14 md:py-20"
        aria-labelledby="verify"
      >
        <div className="shell grid gap-10 lg:grid-cols-2">
          <div>
            <h2 id="verify" className="label">
              § 02 — Verify
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Check which version you're running, and update by rerunning the
              command — there is no upgrade ritual.
            </p>
            <CodeBlock
              className="mt-6"
              code={"relay --version\nrelay --help"}
              prompt
            />
          </div>
          <div>
            <h2 className="label">§ 03 — Next</h2>
            <ul className="mt-4">
              {[
                { to: "/docs", label: "Read the quickstart" },
                { to: "/docs/pairing", label: "How pairing works" },
                { to: "/pricing", label: "Pricing" },
              ].map((l) => (
                <li key={l.to} className="border-b border-rule">
                  <Link
                    href={l.to}
                    className="flex min-h-12 items-center justify-between text-base transition-colors hover:text-muted-foreground"
                  >
                    {l.label}
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
