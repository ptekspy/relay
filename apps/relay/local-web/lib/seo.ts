import type { Metadata } from "next";
import type { Thing, WithContext } from "schema-dts";

export const SITE_URL = "https://paddy.systems";
export const SITE_NAME = "Paddy Systems";

export type JsonLd = WithContext<Thing>;

type SeoArgs = {
  title: string;
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

  return {
    title,
    description,

    alternates: {
      canonical: url,
    },

    openGraph: {
      title,
      description,
      type,
      url,
      siteName: SITE_NAME,
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
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
