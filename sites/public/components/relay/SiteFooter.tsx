import Link from "next/link";
import { GLOBAL_CONFIG } from "@/lib/feature-flags";
import { Dots } from "./Dots";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <Dots size="md" />
            <span className="font-mono text-sm lowercase">relay</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Your dev server, available on the devices you actually test on.
            Local mode free forever.
          </p>
        </div>

        <FooterList
          title="Product"
          items={[
            { label: "Overview", to: "/" },
            { label: "Download", to: "/download" },
            { label: "Pricing", to: "/pricing" },
            ...(GLOBAL_CONFIG.AUTH_ENABLED
              ? [{ label: "Sign in", to: "/sign-in" as const }]
              : []),
          ]}
        />
        <FooterList
          title="Docs"
          items={[
            { label: "Getting started", to: "/docs" },
            { label: "Installation", to: "/docs/installation" },
            { label: "Pairing", to: "/docs/pairing" },
            { label: "Relay Remote", to: "/docs/remote" },
          ]}
        />

        <div>
          <h2 className="label">Paddy Systems</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href="https://paddy-systems-web.lovable.app/"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                paddy.systems
              </a>
            </li>
            <li>
              <a
                href="https://github.com/paddy-systems"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="shell flex flex-col gap-2 border-t border-rule py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="label">Relay — a Paddy Systems product</p>
        <p className="label">© 2026 Paddy Systems Ltd</p>
      </div>
    </footer>
  );
}

function FooterList({
  title,
  items,
}: {
  title: string;
  items: {
    label: string;
    to:
      | "/"
      | "/download"
      | "/pricing"
      | "/sign-in"
      | "/docs"
      | "/docs/installation"
      | "/docs/pairing"
      | "/docs/remote";
  }[];
}) {
  return (
    <div>
      <h2 className="label">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              href={item.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
