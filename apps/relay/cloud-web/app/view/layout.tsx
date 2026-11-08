import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Replay Session",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ViewLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
