export class DocsMetadataSeoGenerator {
  public generateRobotsTxt(domain = "relay.live"): string {
    return `User-agent: *
Allow: /
Sitemap: https://${domain}/sitemap.xml
`;
  }

  public generateSitemapXml(urls: string[], domain = "relay.live"): string {
    const xmlEntries = urls
      .map(
        (url) => `  <url>
    <loc>https://${domain}${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
  }

  public generateOpenGraphTags(
    title: string,
    description: string,
    path: string,
  ): Record<string, string> {
    return {
      "og:title": `${title} | Relay Documentation`,
      "og:description": description,
      "og:type": "article",
      "og:url": `https://relay.live${path}`,
      "og:image": `https://relay.live/og-image.png?title=${encodeURIComponent(title)}`,
      "twitter:card": "summary_large_image",
    };
  }
}

export const docsMetadataSeoGenerator = new DocsMetadataSeoGenerator();
