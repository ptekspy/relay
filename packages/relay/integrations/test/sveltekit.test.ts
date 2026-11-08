import { describe, expect, it } from "bun:test";
import { relaySvelteKit, SvelteKitRelayBridge } from "../src/sveltekit.js";

describe("TASK-122: SvelteKit Dev Middleware Plugin (@paddy-systems/relay-sveltekit)", () => {
  it("creates a valid Vite plugin and transforms HTML", () => {
    const plugin = relaySvelteKit({ relayHost: "http://192.168.1.100:7331" });
    expect(plugin.name).toBe("relay-sveltekit");

    const html =
      "<html><head><title>SvelteKit</title></head><body></body></html>";
    const transformed = plugin.transformIndexHtml?.(html);
    expect(transformed).toContain(
      '<script type="module" src="http://192.168.1.100:7331/agent.js"></script>',
    );
  });

  it("detects port from Vite server configuration", () => {
    const bridge = new SvelteKitRelayBridge();
    const plugin = bridge.createVitePlugin();

    plugin.configureServer({
      config: {
        server: {
          port: 5174,
        },
      },
    });

    expect(bridge.getOptions().targetPort).toBe(5174);
  });

  it("propagates HMR updates to mobile listeners in < 250ms", async () => {
    const bridge = new SvelteKitRelayBridge();
    let receivedUpdate: unknown = null;

    const unsubscribe = bridge.onHmrUpdate((evt) => {
      receivedUpdate = evt;
    });

    const sentAt = Date.now();
    const evt = bridge.notifyHmrUpdate(
      {
        type: "js-update",
        path: "/src/routes/+page.svelte",
      },
      sentAt,
    );

    expect(receivedUpdate).not.toBeNull();
    expect(evt.path).toBe("/src/routes/+page.svelte");
    expect(evt.latencyMs).toBeDefined();
    expect(evt.latencyMs!).toBeLessThan(250);

    unsubscribe();
  });
});
