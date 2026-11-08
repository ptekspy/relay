import type { FrameworkGuide } from "./types.js";

export class RelayFrameworkGuides {
  private static readonly GUIDES: FrameworkGuide[] = [
    {
      slug: "nextjs",
      title: "Next.js (App Router & Pages)",
      framework: "Next.js",
      installCommand: "bun add -D @paddy-systems/relay-next",
      snippet: `// next.config.mjs
import { withRelay } from '@paddy-systems/relay-next';

export default withRelay({
  reactStrictMode: true,
});`,
      verifiedVersion: "14.2.5",
    },
    {
      slug: "vite",
      title: "Vite + React / Vue / Svelte",
      framework: "Vite",
      installCommand: "bun add -D @paddy-systems/relay-vite",
      snippet: `// vite.config.ts
import { defineConfig } from 'vite';
import relayPlugin from '@paddy-systems/relay-vite';

export default defineConfig({
  plugins: [relayPlugin()],
});`,
      verifiedVersion: "5.4.0",
    },
    {
      slug: "astro",
      title: "Astro Modern Web Framework",
      framework: "Astro",
      installCommand: "bun add -D @paddy-systems/relay-astro",
      snippet: `// astro.config.mjs
import { defineConfig } from 'astro/config';
import relay from '@paddy-systems/relay-astro';

export default defineConfig({
  integrations: [relay()],
});`,
      verifiedVersion: "4.15.0",
    },
    {
      slug: "django",
      title: "Django Web Framework (Python)",
      framework: "Django",
      installCommand: "pip install paddy-systems-relay",
      snippet: `# settings.py
MIDDLEWARE = [
    'relay_sdk.django_middleware.RelayScriptInjectionMiddleware',
    # ... other middlewares
]`,
      verifiedVersion: "5.1.0",
    },
    {
      slug: "fastapi",
      title: "FastAPI Async Web Framework (Python)",
      framework: "FastAPI",
      installCommand: "pip install paddy-systems-relay",
      snippet: `# main.py
from fastapi import FastAPI
from relay_sdk.fastapi_middleware import RelayTelemetryMiddleware

app = FastAPI()
app.add_middleware(RelayTelemetryMiddleware)`,
      verifiedVersion: "0.112.0",
    },
  ];

  public listGuides(): FrameworkGuide[] {
    return RelayFrameworkGuides.GUIDES;
  }

  public getGuideBySlug(slug: string): FrameworkGuide | undefined {
    return RelayFrameworkGuides.GUIDES.find((g) => g.slug === slug);
  }
}

export const relayFrameworkGuides = new RelayFrameworkGuides();
