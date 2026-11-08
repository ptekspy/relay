import type { Metadata } from "next";
import { CodeBlock } from "@/components/relay/Code";
import { DocPage, DocSection } from "@/components/relay/DocPage";
import { InstallCommand } from "@/components/relay/InstallCommand";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Getting started — Relay docs",
  description:
    "Install Relay, run one command against your dev server, and pair another device with an access code.",
  path: "/docs",
});

export default function GettingStarted() {
  return (
    <DocPage
      eyebrow="Docs / Getting started"
      title="Getting started"
      lede="Relay shares a port you are already serving. Nothing about your project needs to change."
      next={{ to: "/docs/installation", label: "Installation" }}
    >
      <DocSection title="1. Run your app">
        <p>Start your dev server the way you always do.</p>
        <CodeBlock code="pnpm dev" prompt caption="your project" />
        <p>
          Note the port. Most dev servers use{" "}
          <code className="font-mono text-foreground">3000</code> or{" "}
          <code className="font-mono text-foreground">5173</code>.
        </p>
      </DocSection>

      <DocSection title="2. Run Relay">
        <p>In a second terminal, point Relay at that port.</p>
        <InstallCommand />
        <p>
          Relay checks the port, starts a local gateway, and prints an access
          code.
        </p>
      </DocSection>

      <DocSection title="3. Pair a device">
        <p>
          On the other device, open the pairing address printed in your terminal
          and enter the access code — or scan the QR code shown next to it.
        </p>
        <CodeBlock
          lang="text"
          code={"Pair\nR-7K4P-92MX\n\n● waiting for device"}
          copy={false}
          caption="terminal output"
        />
      </DocSection>

      <DocSection title="4. Work">
        <p>
          The device loads your app. From the session panel you can navigate,
          sync routes, reload, read console output and failed requests, take
          screenshots, and open the app in the device's own browser.
        </p>
        <p>
          Stop the CLI and the session ends. Every paired device disconnects.
        </p>
      </DocSection>
    </DocPage>
  );
}
