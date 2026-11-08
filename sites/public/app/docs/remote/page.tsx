import type { Metadata } from "next";
import { CodeBlock } from "@/components/relay/Code";
import { DocPage, DocSection } from "@/components/relay/DocPage";
import { GLOBAL_CONFIG } from "@/lib/feature-flags";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Relay Remote — Relay docs",
  description:
    "Relay Remote extends a Relay session beyond your local network using the same command and pairing model.",
  path: "/docs/remote",
});

export default function Remote() {
  return (
    <DocPage
      eyebrow="Docs / Relay Remote"
      title="Relay Remote"
      lede="When the other device isn't on your network, Remote carries the same session further."
    >
      <DocSection title="Starting a remote session">
        <CodeBlock code="relay share" prompt />
        <p>
          You still get an access code, still see the same session panel, and
          still stop the session by stopping the CLI.
        </p>
      </DocSection>

      <DocSection title="What changes">
        <ul className="space-y-2">
          {[
            "Devices no longer need to be on your network",
            "Sessions are relayed through Paddy Systems infrastructure",
            "Sessions have an explicit expiry",
            "Remote is a paid capability",
          ].map((i) => (
            <li key={i} className="border-b border-rule pb-2">
              {i}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection title="What doesn't change">
        <p>
          Relay Local stays free and complete. Remote is an extra reach, not the
          real product hidden behind a paywall.
        </p>
      </DocSection>

      <DocSection title="Status">
        <p>
          Remote is in development. Pricing will be published before launch.
          {GLOBAL_CONFIG.AUTH_ENABLED && " Sign in to be told when it opens."}
        </p>
      </DocSection>
    </DocPage>
  );
}
