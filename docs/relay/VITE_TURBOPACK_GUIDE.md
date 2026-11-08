# Integrating Relay with Vite & Turbopack

This guide covers configuring Vite and Turbopack dev servers for seamless mobile pairing, HMR stability, and telemetry collection via Paddy Systems Relay.

---

## 1. Vite Configuration

### Binding to Network Interfaces (`--host`)
By default, Vite binds strictly to `localhost` (`127.0.0.1`). To allow Relay's reverse proxy and LAN receivers to connect:

**Option A: Command Line**
```bash
vite --host
```

**Option B: `vite.config.ts`**
```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { relayPlugin } from "@paddy-systems/relay-agent/vite";

export default defineConfig({
  plugins: [
    react(),
    // Automatically injects Relay telemetry agent in development
    relayPlugin({ port: 7331 }),
  ],
  server: {
    host: true, // Listens on 0.0.0.0 for LAN access
    port: 5173,
    strictPort: true,
    hmr: {
      // Allows HMR WebSocket to negotiate through Relay proxy
      clientPort: 5173,
    },
  },
});
```

### Running Relay with Vite
```bash
# Terminal 1:
bun run dev

# Terminal 2:
relay 5173
```

---

## 2. Turbopack Configuration

When running Next.js or standalone packages with Turbopack (`next dev --turbo`):

### 1. Host Binding
```bash
next dev --turbo -H 0.0.0.0 -p 3000
```

### 2. Turbopack HMR Stability
Turbopack establishes persistent event-streams (`/_next/static/webpack/turbopack-events`). Relay automatically sets `X-Accel-Buffering: no` and disables chunked compression on server-sent event (SSE) streams, preventing buffer delays during code updates.

---

## 3. Verifying Setup

Once running:
1. Scan the QR code displayed in the Relay CLI.
2. Open DevTools in your browser at `http://localhost:7331`.
3. In the Relay local dashboard, you should see:
   - Green connected status indicator.
   - Live HMR updates reflected on your mobile phone within < 100ms.
   - All Vite / Turbopack console logs mirrored in real time.
