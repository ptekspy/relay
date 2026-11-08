import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";

import { SiteFooter } from "@/components/relay/SiteFooter";
import { SiteHeader } from "@/components/relay/SiteHeader";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-app",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Relay — your dev server, wherever you need it",
  description:
    "Relay shares your local dev server with another device using one command and a short access code. No public ports, no config. Free for local use.",
  authors: [{ name: "Paddy Systems" }],
  openGraph: {
    title: "Relay — your dev server, wherever you need it",
    description:
      "One command, one access code, and your local dev server is running on the device you need to test on.",
    type: "website",
    siteName: SITE_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Relay — your dev server, wherever you need it",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@PaddySystems",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className="dark">
      <body className={`${inter.variable} ${jetBrainsMono.variable}`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-100 focus:border focus:border-input focus:bg-background focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to main content
        </a>

        <SiteHeader />

        <main id="main">{children}</main>

        <SiteFooter />
      </body>
    </html>
  );
}
