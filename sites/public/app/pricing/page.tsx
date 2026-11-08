import type { Metadata } from "next";
import Link from "next/link";
import { Dots } from "@/components/relay/Dots";
import { InstallCommand } from "@/components/relay/InstallCommand";
import { GLOBAL_CONFIG } from "@/lib/feature-flags";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Pricing — Relay",
  description:
    "Relay Local is free forever, with unlimited sessions and devices on your own network. Relay Remote is paid and in development.",
  path: "/pricing",
});

const ROWS: { feature: string; local: string; remote: string }[] = [
  { feature: "Sessions", local: "Unlimited", remote: "Unlimited" },
  { feature: "Devices per session", local: "Unlimited", remote: "Unlimited" },
  { feature: "Pairing by access code", local: "Yes", remote: "Yes" },
  { feature: "QR and deep links", local: "Yes", remote: "Yes" },
  { feature: "Session panel and controls", local: "Yes", remote: "Yes" },
  {
    feature: "Console, exceptions, failed requests",
    local: "Yes",
    remote: "Yes",
  },
  { feature: "Screenshots and bug reports", local: "Yes", remote: "Yes" },
  { feature: "Devices on your network", local: "Yes", remote: "Yes" },
  { feature: "Devices anywhere", local: "No", remote: "Yes" },
  { feature: "Shareable session expiry", local: "—", remote: "Yes" },
];

export default function Pricing() {
  return (
    <>
      <section className="border-b border-rule py-14 md:py-20">
        <div className="shell">
          <p className="label flex items-center gap-3">
            <Dots size="sm" /> Pricing
          </p>
          <h1 className="mt-6 max-w-2xl text-[2.25rem] leading-[1.08] font-medium tracking-tight md:text-[3rem]">
            Local is free. Remote costs money to run.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            No seat maths, no feature hostages. Everything Relay does on your
            own network is free permanently.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20" aria-labelledby="plans">
        <div className="shell">
          <h2 id="plans" className="sr-only">
            Plans
          </h2>
          <div className="grid gap-px border border-border md:grid-cols-2">
            <div className="flex flex-col gap-5 border-r border-rule p-6 md:p-8">
              <div>
                <h3 className="text-xl font-medium">Relay Local</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The complete local product, for anyone.
                </p>
              </div>
              <p className="font-mono text-4xl">
                Free
                <span className="ml-2 align-middle text-sm text-muted-foreground">
                  forever
                </span>
              </p>
              <InstallCommand />
              <Link
                href="/docs"
                className="inline-flex min-h-11 w-fit items-center gap-2 border border-input px-4 text-sm transition-colors hover:bg-secondary"
              >
                Quickstart <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="flex flex-col gap-5 p-6 md:p-8">
              <div>
                <h3 className="text-xl font-medium">Relay Remote</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sessions that reach past your network.
                </p>
              </div>
              <p className="font-mono text-4xl">
                Paid
                <span className="ml-2 align-middle text-sm text-muted-foreground">
                  in development
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Pricing is published before launch. It will be a flat price, not
                a per-seat ladder.
              </p>
              {GLOBAL_CONFIG.AUTH_ENABLED && (
                <Link
                  href="/sign-in"
                  className="inline-flex min-h-11 w-fit items-center gap-2 border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Get notified <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-t border-rule py-14 md:py-20"
        aria-labelledby="compare"
      >
        <div className="shell">
          <h2 id="compare" className="label">
            § 01 — Comparison
          </h2>
          <section
            className="mt-8 overflow-x-auto"
            aria-label="Plan comparison table"
          >
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="label pb-3 font-normal">
                    Capability
                  </th>
                  <th scope="col" className="label pb-3 font-normal">
                    Local
                  </th>
                  <th scope="col" className="label pb-3 font-normal">
                    Remote
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-rule">
                    <th scope="row" className="py-3 pr-6 font-normal">
                      {row.feature}
                    </th>
                    <td className="py-3 pr-6 font-mono text-xs">{row.local}</td>
                    <td className="py-3 font-mono text-xs">{row.remote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </section>
    </>
  );
}
