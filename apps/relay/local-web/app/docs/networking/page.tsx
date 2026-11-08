import type { Metadata } from "next";
import { CodeBlock } from "@/components/relay/Code";
import { DocPage, DocSection } from "@/components/relay/DocPage";
import { Architecture } from "@/components/relay/Section";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Local networking — Relay docs",
  description:
    "How Relay Local uses your network: interfaces, firewalls, ports, and why nothing is published publicly.",
  path: "/docs/networking",
});

export default function Networking() {
  return (
    <DocPage
      eyebrow="Docs / Reference"
      title="Local networking"
      lede="Relay Local serves from your machine over the network you're already on. There is no tunnel."
      next={{ to: "/docs/troubleshooting", label: "Troubleshooting" }}
    >
      <DocSection title="How it connects">
        <Architecture />
      </DocSection>

      <DocSection title="Interfaces">
        <p>
          Relay picks the interface your devices can reach. On machines with
          several — VPNs, virtual adapters, docking stations — choose one
          explicitly.
        </p>
        <CodeBlock code="relay 3000 --host 192.168.1.24" prompt />
      </DocSection>

      <DocSection title="Firewalls">
        <p>
          The first run may prompt for permission to accept incoming connections
          on your local network. Relay needs this; without it devices can reach
          nothing.
        </p>
      </DocSection>

      <DocSection title="Guest and isolated networks">
        <p>
          Many public and guest networks block device-to-device traffic. If
          pairing succeeds but the app never loads, client isolation is the
          usual cause — use a phone hotspot, or Relay Remote.
        </p>
      </DocSection>

      <DocSection title="What is not exposed">
        <p>
          Local mode opens no public port and registers no public hostname. Your
          app is reachable only from devices holding a live access code on your
          network.
        </p>
      </DocSection>
    </DocPage>
  );
}
