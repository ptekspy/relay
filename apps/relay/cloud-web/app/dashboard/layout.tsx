import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-black text-zinc-100">
      <DashboardNav />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
