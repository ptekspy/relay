"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dots } from "@/components/relay/Dots";

const NAV = [
  {
    title: "Start here",
    items: [
      { to: "/docs", label: "Getting started", exact: true },
      { to: "/docs/installation", label: "Installation" },
      { to: "/docs/pairing", label: "Pairing" },
    ],
  },
  {
    title: "Reference",
    items: [
      { to: "/docs/networking", label: "Local networking" },
      { to: "/docs/troubleshooting", label: "Troubleshooting" },
      { to: "/docs/remote", label: "Relay Remote" },
    ],
  },
] as const;

export default function DocsLayout({ children }: LayoutProps<"/docs">) {
  const pathname = usePathname();

  return (
    <div className="shell grid gap-10 py-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14 lg:py-14">
      <nav
        aria-label="Documentation"
        className="lg:sticky lg:top-20 lg:self-start"
      >
        <p className="label flex items-center gap-2">
          <Dots size="sm" /> Docs
        </p>
        <div className="mt-5 space-y-6">
          {NAV.map((group) => (
            <div key={group.title}>
              <h2 className="label">{group.title}</h2>
              <ul className="mt-2">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <Link
                      href={item.to}
                      aria-current={pathname === item.to ? "page" : undefined}
                      className={`flex min-h-10 items-center pl-3 text-sm transition-colors hover:text-foreground ${
                        ("exact" in item ? item.exact : false)
                          ? pathname === item.to
                            ? "text-foreground border-l-2 border-violet"
                            : "text-muted-foreground border-l border-rule"
                          : pathname.startsWith(item.to)
                            ? "text-foreground border-l-2 border-violet"
                            : "text-muted-foreground border-l border-rule"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
