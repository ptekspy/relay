"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "Sessions", href: "/dashboard/sessions", icon: "Radio" },
  { label: "Devices", href: "/dashboard/devices", icon: "Monitor" },
  { label: "Team & Roles", href: "/dashboard/team", icon: "Users" },
  { label: "Audit Log", href: "/dashboard/audit", icon: "Shield" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("ps_relay_theme") as
      | "dark"
      | "light"
      | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("ps_relay_theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between shrink-0 p-4">
      <div>
        <div className="flex items-center justify-between px-2 py-4 border-b border-zinc-800 mb-6">
          <Link
            href="/dashboard/sessions"
            className="flex items-center gap-2 font-bold text-lg text-white"
          >
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span>Relay Cloud</span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
            v1.0
          </span>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-zinc-800 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-zinc-800 flex items-center justify-between px-2">
        <span className="text-xs text-zinc-500">Theme</span>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="px-2.5 py-1 text-xs rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>
    </aside>
  );
}
