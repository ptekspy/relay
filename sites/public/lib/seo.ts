import type { Metadata } from "next";
import type { Thing, WithContext } from "schema-dts";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://relay.live";
export const SITE_NAME = "Relay — Paddy Systems";

export type JsonLd = WithContext<Thing>;

type SeoArgs = {
  title: string | { absolute: string };
  description: string;
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
};

export function seo({
  title,
  description,
  path,
  type = "website",
  noindex = false,
}: SeoArgs): Metadata {
  const url = new URL(path, SITE_URL).toString();
  const rawTitle = typeof title === "string" ? title : title.absolute;

  return {
    title,
    description,

    alternates: {
      canonical: url,
    },

    openGraph: {
      title: rawTitle,
      description,
      type,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: rawTitle,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: rawTitle,
      description,
      site: "@PaddySystems",
      images: [`${SITE_URL}/og-image.png`],
    },

    ...(noindex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}
