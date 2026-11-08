# Integrating Relay with Next.js (App & Pages Router)

This guide explains how to pair your local Next.js development server with Paddy Systems Relay for zero-friction mobile testing, real-time telemetry, and viewport testing.

---

## 1. Quick Start

Run your Next.js application as usual, and launch Relay pointing to Next.js's dev port:

```bash
# Terminal 1: Start Next.js
bun dev # or pnpm dev, npm run dev (defaults to port 3000)

# Terminal 2: Start Relay
relay 3000
```

Relay detects the running Next.js dev server on port `3000`, generates a secure QR code and short code in your terminal, and launches the local gateway on `http://<your-lan-ip>:7331`.

---

## 2. Ingesting Real-Time Telemetry with `<RelayAgent />`

To capture client-side console logs, network latency, touch coordinates, and uncaught exceptions on mobile devices directly in Relay, install the agent package:

```bash
bun add -d @paddy-systems/relay-agent
```

### App Router Setup (`app/layout.tsx`)

Add `<RelayAgent />` inside your root layout. It only activates in development mode (`process.env.NODE_ENV === "development"`):

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { RelayAgent } from "@paddy-systems/relay-agent/react";

export const metadata: Metadata = {
  title: "My Next.js App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <RelayAgent port={7331} />
      </body>
    </html>
  );
}
```

### Pages Router Setup (`pages/_app.tsx`)

```tsx
// pages/_app.tsx
import type { AppProps } from "next/app";
import { RelayAgent } from "@paddy-systems/relay-agent/react";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <RelayAgent port={7331} />
    </>
  );
}
```

---

## 3. Host Binding Configuration

By default, Next.js 14+ binds to `localhost` (`127.0.0.1`). If you are running Relay in transparent reverse proxy mode, ensure Next.js accepts connections across local network interfaces:

```json
// package.json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0"
  }
}
```

---

## 4. Next.js Image Optimization Considerations

Next.js `<Image />` tags optimize images via `/_next/image?url=...&w=...`.
- When tested through Relay's proxy, image requests preserve the `Host` and `X-Forwarded-Host` headers automatically.
- No modifications to `next.config.js` `images.remotePatterns` are required for local assets.

---

## 5. Hot Module Replacement (HMR) & WebSockets

Next.js uses an internal WebSocket for Fast Refresh (`/_next/webpack-hmr`). Relay's gateway transparently proxies WebSocket upgrade handshakes with bidirectional frame streaming, so code edits on your laptop instantly hot-reload on your mobile phone without losing component state.
