import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = [
    "",
    "/download",
    "/pricing",
    "/docs",
    "/docs/installation",
    "/docs/networking",
    "/docs/pairing",
    "/docs/remote",
    "/docs/troubleshooting",
  ];

  const now = new Date();

  return publicRoutes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1.0 : path.startsWith("/docs") ? 0.8 : 0.7,
  }));
}
