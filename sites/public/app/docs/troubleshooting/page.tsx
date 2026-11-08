import type { Metadata } from "next";
import { CodeBlock } from "@/components/relay/Code";
import { DocPage, DocSection } from "@/components/relay/DocPage";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Troubleshooting — Relay docs",
  description:
    "Fixes for the common Relay problems: port not reachable, device won't attach, assets missing, session drops.",
  path: "/docs/troubleshooting",
});

const ISSUES = [
  {
    q: "Port not reachable",
    a: "Relay checked the port before starting and found nothing serving. Confirm your dev server is running and using the port you passed.",
    code: "curl -I http://localhost:3000",
  },
  {
    q: "Device won't attach",
    a: "The code is correct but nothing loads. Both devices must be on the same network, and that network must allow device-to-device traffic.",
  },
  {
    q: "App loads but assets are missing",
    a: "Some dev servers hardcode localhost in asset URLs. Set your framework's host or public origin so it emits network-relative URLs.",
    code: "pnpm dev --host",
  },
  {
    q: "Session drops when the phone sleeps",
    a: "Mobile browsers suspend background tabs. The Relay Android app holds the session and restores your last route on wake.",
  },
  {
    q: "Wrong network interface",
    a: "A VPN or virtual adapter was chosen. Bind Relay to the address your devices can actually see.",
    code: "relay 3000 --host 192.168.1.24",
  },
];

export default function Troubleshooting() {
  return (
    <DocPage
      eyebrow="Docs / Reference"
      title="Troubleshooting"
      lede="Almost every Relay problem is one of these five."
      next={{ to: "/docs/remote", label: "Relay Remote" }}
    >
      {ISSUES.map((issue) => (
        <DocSection key={issue.q} title={issue.q}>
          <p>{issue.a}</p>
          {issue.code && <CodeBlock code={issue.code} prompt />}
        </DocSection>
      ))}
    </DocPage>
  );
}
