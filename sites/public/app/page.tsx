import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/relay/Code";
import { DeviceWall } from "@/components/relay/DeviceWall";
import { Dots } from "@/components/relay/Dots";
import { Marquee, Reveal } from "@/components/relay/Fx";
import { InstallCommand } from "@/components/relay/InstallCommand";
import { RelayStage, TERMINAL_SLOT_ID } from "@/components/relay/RelayStage";
import { Architecture, Section } from "@/components/relay/Section";
import { SessionPanel } from "@/components/relay/SessionPanel";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Relay — run your local dev server on another device",
  description:
    "Start your app, run one Relay command, pair a device with a short access code, or QR code. Relay Local is free forever. From Paddy Systems.",
  path: "/",
});

const STEPS = [
  {
    n: "01",
    title: "Start your app",
    body: "Nothing changes. Relay works alongside the dev server you already run.",
    code: "pnpm dev",
    note: "localhost:3000",
  },
  {
    n: "02",
    title: "Start Relay",
    body: "One command, pointed at the port you're already serving.",
    code: "relay 3000",
    note: "gateway running",
  },
  {
    n: "03",
    title: "Pair",
    body: "Enter the access code on the other device, or scan the QR code.",
    code: "R-7K4P-92MX",
    note: "waiting for device",
  },
  {
    n: "04",
    title: "Use it",
    body: "Your app loads on the device. Navigate, reload, read errors, keep working.",
    code: "connected",
    note: "1 device attached",
  },
];

const STACK = [
  "Next.js",
  "Vite",
  "Nuxt",
  "SvelteKit",
  "Astro",
  "Remix",
  "Rails",
  "Django",
  "Laravel",
  "Express",
  "Phoenix",
  "Anything on a port",
];

const NOT_REQUIRED = [
  "No SDK to install",
  "No framework plugin",
  "No source changes",
  "No Docker",
  "No public ports",
  "No manual IP hunting",
];

export default function Home() {
  return (
    <>
      {/* ---------- The stage: a full-viewport overlay above everything ---------- */}
      <RelayStage />

      {/* ---------- Hero (revealed beneath the stage) ---------- */}
      <section className="relative isolate overflow-hidden border-b border-rule">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="grid-field absolute inset-0 opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,oklch(0.22_0.06_285/_60%),transparent_70%)]" />
        </div>

        <div className="pt-14 pb-16">
          <div className="shell">
            <div className="flex flex-wrap items-center gap-4">
              <span
                aria-hidden="true"
                className="pulse-dot block size-[7px] bg-magenta"
              />
              <p className="label flex items-center gap-3">
                <Dots size="sm" active /> one localhost · every device in the
                room
              </p>
              <span
                aria-hidden="true"
                className="spectrum-rule max-w-[38%] flex-1"
              />
            </div>
            <h1 className="display-big mt-5 max-w-[20ch] pb-1">
              Your localhost, on every device in the room.
            </h1>

            {/* the session panel from the stage lands here, in the page's own layout */}
            <div
              id={TERMINAL_SLOT_ID}
              className="mt-10 h-[300px] w-full max-w-3xl sm:h-[260px]"
            />
          </div>
        </div>
      </section>

      {/* ---------- Install ---------- */}
      <section className="border-b border-rule">
        <div className="shell grid items-start gap-12 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 md:py-24">
          <div className="min-w-0">
            <p className="max-w-lg border-l-2 border-violet/60 pl-6 text-lg text-foreground/85">
              Relay hands your running dev server to every device you test on —
              phone, tablet, laptop, browser — with one command and a short
              access code. They all load the same app. They all reload together.
            </p>

            <div className="mt-8">
              <p className="label mb-3">Install and run</p>
              <InstallCommand />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/docs"
                className="inline-flex min-h-11 items-center gap-2 border border-input bg-background/90 px-4 text-xs font-extrabold tracking-wide uppercase transition-colors hover:bg-secondary"
              >
                Quickstart <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/download"
                className="inline-flex min-h-11 items-center px-4 text-xs font-extrabold tracking-wide uppercase text-muted-foreground transition-colors hover:text-foreground"
              >
                Downloads
              </Link>
            </div>
          </div>

          <div className="min-w-0">
            <ul className="grid grid-cols-2 gap-px border border-border sm:grid-cols-4">
              {[
                ["Setup", "1 command"],
                ["Ports", "none public"],
                ["Traffic", "your network"],
                ["Local mode", "free"],
              ].map(([k, v]) => (
                <li
                  key={k}
                  className="border-r border-rule px-3 py-3 last:border-0"
                >
                  <p className="label">{k}</p>
                  <p className="mt-1 font-mono text-xs">{v}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Marquee
        items={[
          "No public ports",
          "Access code R-7K4P-92MX",
          "Local mode free forever",
          "CLI · QR pairing · browser",
          "Phone · tablet · laptop",
          "One command",
        ]}
      />

      {/* ---------- 01 Workflow ---------- */}
      <Section
        index="01"
        eyebrow="Workflow"
        title="Start Relay. Pair. Done."
        lede="Four moves from a local dev server to a working session on another device. There is no fifth step."
      >
        <ol className="grid gap-px border border-border md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step) => (
            <li
              key={step.n}
              className="flex flex-col gap-4 border-r border-b border-rule p-5 last:border-r-0"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="label">{step.n}</span>
                <Dots size="sm" />
              </div>
              <h3 className="text-lg font-medium tracking-tight">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
              <div className="mt-auto border border-border bg-surface px-3 py-2.5">
                <p className="font-mono text-[0.8125rem]">{step.code}</p>
                <p className="mt-1 font-mono text-[0.6875rem] text-muted-foreground">
                  {step.note}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- 02 Session ---------- */}
      <Section
        index="02"
        eyebrow="Session"
        title="A session, not a dashboard."
        lede="Relay shows what the connected devices are doing and gives you the controls worth having. Nothing more. The panel below is a simulated session with example data."
      >
        <SessionPanel />

        <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
          Route visibility, remote navigation, route sync, reload, console
          output, JavaScript exceptions, failed requests, screenshots, bug
          reports, viewport and orientation. Relay is not a replacement for your
          browser's developer tools — it is the part that only exists when a
          second device is involved.
        </p>
      </Section>

      {/* ---------- 03 Stack ---------- */}
      <Section
        index="03"
        eyebrow="Compatibility"
        title="It works with whatever you already run."
        lede="Relay attaches to a port. If your app serves HTTP on localhost, Relay can share it."
      >
        <div className="grid gap-px border border-border lg:grid-cols-[1.3fr_1fr]">
          <ul className="flex flex-wrap gap-2 border-r border-rule p-5">
            {STACK.map((s) => (
              <li
                key={s}
                className="border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground"
              >
                {s}
              </li>
            ))}
          </ul>
          <ul className="p-5">
            {NOT_REQUIRED.map((n) => (
              <li
                key={n}
                className="flex items-center gap-3 border-b border-rule py-2.5 text-sm last:border-0"
              >
                <span aria-hidden="true" className="text-ok">
                  ✓
                </span>
                {n}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ---------- 04 Architecture ---------- */}
      <Section
        index="04"
        eyebrow="Architecture"
        title="Local traffic stays local."
        lede="Relay Local runs a gateway on your own machine and hands out a short-lived access code. Nothing is published to the internet."
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <Architecture />
          <dl className="self-center">
            {[
              [
                "One machine, one gateway",
                "Relay serves from your development machine over the network you're already on.",
              ],
              [
                "Access codes, not URLs",
                "A code like R-7K4P-92MX pairs a device. Codes expire with the session.",
              ],
              [
                "No inbound exposure",
                "There is no tunnel and no public port in local mode. Your app is not on the internet.",
              ],
              [
                "Sessions end cleanly",
                "Stop the CLI and every paired device disconnects. Nothing is left running.",
              ],
            ].map(([term, desc]) => (
              <div
                key={term}
                className="border-b border-rule py-5 first:pt-0 last:border-0"
              >
                <dt className="text-base font-medium">{term}</dt>
                <dd className="mt-2 text-sm text-muted-foreground">{desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* ---------- 05 Remote ---------- */}
      <Section
        index="05"
        eyebrow="Relay Remote"
        title="Same command. Wider reach."
        lede="When the other device isn't on your network, Relay Remote extends the same session beyond the LAN. It is the next capability of Relay, not a different product."
      >
        <div className="grid gap-px border border-border md:grid-cols-2">
          <div className="border-r border-rule p-6">
            <p className="label">Local — free</p>
            <CodeBlock
              className="mt-4"
              code="relay 3000"
              prompt
              copy={false}
              caption="same network"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Devices on your network. Access code pairing. Full session
              controls.
            </p>
          </div>
          <div className="p-6">
            <p className="label">Remote — paid</p>
            <CodeBlock
              className="mt-4"
              code="relay share"
              prompt
              copy={false}
              caption="anywhere"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Hand a session to someone else's device, wherever they are. Same
              pairing, same panel.
            </p>
          </div>
        </div>
      </Section>

      <Marquee
        reverse
        items={[
          "Devices attach in seconds",
          "Console output streamed",
          "Failed requests captured",
          "Reload every device at once",
          "Screenshots and bug reports",
          "Sessions end when you stop the CLI",
        ]}
      />

      {/* ---------- 06 Pricing ---------- */}
      <Section
        index="06"
        eyebrow="Pricing"
        title="Local is free. That isn't a trial."
        lede="Relay Local is the whole local product, permanently free. Remote is paid because it costs us to run."
      >
        <div className="grid gap-px border border-border md:grid-cols-2">
          <div className="border-r border-rule p-6">
            <h3 className="text-xl font-medium">Relay Local</h3>
            <p className="mt-2 font-mono text-2xl">Free</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Unlimited sessions and devices on your own network.
            </p>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-medium">Relay Remote</h3>
            <p className="mt-2 font-mono text-2xl">Paid</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Sessions beyond your network. Pricing published at launch.
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="mt-6 inline-flex min-h-11 items-center gap-2 border border-input px-4 text-sm transition-colors hover:bg-secondary"
        >
          Full pricing <span aria-hidden="true">→</span>
        </Link>
      </Section>

      {/* ---------- 07 Docs ---------- */}
      <Section
        index="07"
        eyebrow="Documentation"
        title="Read it in five minutes."
        lede="The docs are short on purpose. Install, pair, and the CLI reference cover nearly everything."
      >
        <ul className="grid gap-px border border-border md:grid-cols-3">
          {[
            {
              to: "/docs",
              title: "Getting started",
              body: "From zero to a paired device.",
            },
            {
              to: "/docs/installation",
              title: "Installation",
              body: "npm, pnpm, bun, global.",
            },
            {
              to: "/docs/pairing",
              title: "Pairing",
              body: "Access codes, QR, device states.",
            },
            {
              to: "/docs/remote",
              title: "Relay Remote",
              body: "Sharing beyond your local network.",
            },
            {
              to: "/docs/networking",
              title: "Local networking",
              body: "LAN, firewalls, ports.",
            },
            {
              to: "/docs/troubleshooting",
              title: "Troubleshooting",
              body: "When a device won't attach.",
            },
          ].map((d) => (
            <li key={d.to} className="border-r border-b border-rule">
              <Link
                href={d.to}
                className="group flex h-full flex-col gap-2 p-5 transition-colors hover:bg-secondary"
              >
                <span className="flex items-center justify-between">
                  <span className="text-base font-medium">{d.title}</span>
                  <span aria-hidden="true" className="text-muted-foreground">
                    →
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">{d.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- Close ---------- */}
      <section className="relative isolate overflow-hidden border-t border-rule pt-16 md:pt-24">
        <div className="shell">
          <Reveal>
            <Dots size="lg" active />
            <h2 className="display-big mt-6 max-w-[20ch] pb-1">
              One command. Every screen you own.
            </h2>
          </Reveal>
          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="label max-w-[40ch] text-foreground/70">
              Relay Local — free forever · Paddy Systems
            </p>
            <InstallCommand className="w-full md:max-w-xl" />
          </div>
        </div>
        <div className="relative mt-14 max-h-[34svh] overflow-hidden px-2 md:px-4">
          <DeviceWall />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-background to-transparent"
          />
        </div>
      </section>
    </>
  );
}
