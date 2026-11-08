import type { Metadata } from "next";
import { CodeBlock } from "@/components/relay/Code";
import { DocPage, DocSection } from "@/components/relay/DocPage";
import { Dots } from "@/components/relay/Dots";
import { seo } from "@/lib/seo";

export const metadata: Metadata = seo({
  title: "Pairing — Relay docs",
  description:
    "How Relay access codes, QR pairing and device states work, and how sessions end.",
  path: "/docs/pairing",
});

const STATES = [
  {
    state: "Issued",
    meaning: "A code exists. No device has used it yet.",
    tone: "muted",
  },
  {
    state: "Waiting",
    meaning: "Relay is listening for the first device.",
    tone: "muted",
  },
  {
    state: "Connected",
    meaning: "A device is attached and receiving your app.",
    tone: "ok",
  },
  {
    state: "Dropped",
    meaning: "The device lost the network. Relay keeps the slot briefly.",
    tone: "warn",
  },
  {
    state: "Ended",
    meaning: "The session was stopped. The code no longer works.",
    tone: "muted",
  },
];

export default function Pairing() {
  return (
    <DocPage
      eyebrow="Docs / Pairing"
      title="Pairing"
      lede="A Relay session is joined with a short access code. There is no URL to guess and no port to expose."
      next={{ to: "/docs/networking", label: "Local networking" }}
    >
      <DocSection title="Access codes">
        <p>Every session prints a code in the form:</p>
        <CodeBlock lang="text" code="R-7K4P-92MX" caption="access code" />
        <p>
          Codes are tied to one session and stop working when the CLI exits.
          Rotate a code at any time without restarting your app.
        </p>
        <CodeBlock code="relay 3000 --rotate-code" prompt />
      </DocSection>

      <DocSection title="QR and deep links">
        <p>
          Relay prints a QR code alongside the access code. Scanning it opens
          the session directly — on Android with the Relay app installed, the
          deep link opens the app instead of the browser.
        </p>
      </DocSection>

      <DocSection title="Device states">
        <table className="w-full text-left text-sm">
          <caption className="label mb-3 text-left">
            State is shown with a label as well as colour
          </caption>
          <thead>
            <tr className="border-b border-rule">
              <th scope="col" className="label pb-2 font-normal">
                State
              </th>
              <th scope="col" className="label pb-2 font-normal">
                Meaning
              </th>
            </tr>
          </thead>
          <tbody>
            {STATES.map((s) => (
              <tr key={s.state} className="border-b border-rule">
                <td className="py-3 pr-4 align-top">
                  <span className="flex items-center gap-2 font-mono text-xs whitespace-nowrap">
                    <Dots size="sm" active={s.state === "Connected"} />
                    {s.state}
                  </span>
                </td>
                <td className="py-3 align-top">{s.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DocSection>

      <DocSection title="Multiple devices">
        <p>
          A session accepts several devices at once — a phone, a tablet and a
          second laptop can all share one code. Actions apply to all attached
          devices, or to one you select.
        </p>
      </DocSection>
    </DocPage>
  );
}
