import type { Metadata } from "next";
import { CodeBlock } from "@/components/relay/Code";
import { DocPage, DocSection } from "@/components/relay/DocPage";
import { InstallCommand } from "@/components/relay/InstallCommand";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Installation — Relay docs",
  description:
    "Install the Relay CLI with npm, pnpm, bun, or globally. Requirements and the Android app.",
  path: "/docs/installation",
});

export default function Installation() {
  return (
    <DocPage
      eyebrow="Docs / Installation"
      title="Installation"
      lede="Relay is a single CLI. You can run it without installing anything permanently."
      next={{ to: "/docs/pairing", label: "Pairing" }}
    >
      <DocSection title="Run without installing">
        <InstallCommand />
        <p>
          This is the fastest path and always uses the current version.
          Substitute your port for{" "}
          <code className="font-mono text-foreground">3000</code>.
        </p>
      </DocSection>

      <DocSection title="Install globally">
        <CodeBlock
          code={"npm i -g @paddy-systems/relay-cli\nrelay 3000"}
          prompt
        />
        <p>
          After a global install the command is simply{" "}
          <code className="font-mono text-foreground">relay</code>.
        </p>
      </DocSection>

      <DocSection title="Requirements">
        <ul className="space-y-2">
          {[
            "Node.js 20 or newer",
            "macOS, Linux, or Windows",
            "Your devices on the same network (local mode)",
          ].map((r) => (
            <li key={r} className="flex gap-3 border-b border-rule pb-2">
              <span aria-hidden="true" className="text-ok">
                ✓
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection title="Android app">
        <p>
          The Android app is optional. Any modern browser can join a session,
          but the app keeps sessions alive in the background and restores the
          last route on reconnect.
        </p>
      </DocSection>

      <DocSection title="Verify">
        <CodeBlock code="relay --version" prompt />
      </DocSection>
    </DocPage>
  );
}
