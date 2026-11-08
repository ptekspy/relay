import { describe, expect, it } from "bun:test";
import {
  defineRelayNuxtModule,
  generateTerminalBanner,
  injectAgentIntoHtml,
} from "../src/nuxt.js";

describe("TASK-121: Nuxt 3 Relay Module (@paddy-systems/relay-nuxt)", () => {
  it("initializes module with sensible defaults and generates pairing URL", () => {
    const mod = defineRelayNuxtModule({ port: 3000 });
    expect(mod.name).toBe("@paddy-systems/relay-nuxt");

    const result = mod.setup({}, {});
    expect(result.isDevOnly).toBe(true);
    expect(result.pairingUrl).toBe("http://localhost:7331/pair?target=3000");
    expect(result.injectedScript).toContain("http://localhost:7331/agent.js");
  });

  it("injects agent script cleanly into HTML document head", () => {
    const rawHtml =
      "<!DOCTYPE html><html><head><title>Nuxt App</title></head><body><h1>Hello</h1></body></html>";
    const injected = injectAgentIntoHtml(rawHtml, "http://192.168.1.50:7331");

    expect(injected).toContain(
      '<script type="module" src="http://192.168.1.50:7331/agent.js"></script>',
    );
    expect(injected).toContain("</head>");
  });

  it("generates clear terminal banner with pairing instructions", () => {
    const banner = generateTerminalBanner(
      "http://192.168.1.50:7331/pair?target=3000",
    );
    expect(banner).toContain("Relay Mobile Pairing Active");
    expect(banner).toContain("http://192.168.1.50:7331/pair?target=3000");
  });
});
