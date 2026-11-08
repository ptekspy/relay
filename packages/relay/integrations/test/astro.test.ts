import { describe, expect, it } from "bun:test";
import { relayAstro } from "../src/astro.js";

describe("TASK-124: Astro Integration Plugin (@paddy-systems/relay-astro)", () => {
  it("registers integration with proper hooks", () => {
    const integration = relayAstro({ relayHost: "http://192.168.1.50:7331" });
    expect(integration.name).toBe("@paddy-systems/relay-astro");
    expect(integration.hooks["astro:config:setup"]).toBeDefined();
    expect(integration.hooks["astro:server:setup"]).toBeDefined();
  });

  it("injects inline script hooking into Astro View Transitions", () => {
    const integration = relayAstro({
      relayHost: "http://192.168.1.50:7331",
      syncViewTransitions: true,
    });

    let stageInjected = "";
    let contentInjected = "";

    const setupHook = integration.hooks["astro:config:setup"];
    setupHook?.({
      injectScript: (stage, content) => {
        stageInjected = stage;
        contentInjected = content;
      },
      updateConfig: () => {},
    });

    expect(stageInjected).toBe("head-inline");
    expect(contentInjected).toContain("http://192.168.1.50:7331/agent.js");
    expect(contentInjected).toContain("astro:after-swap");
    expect(contentInjected).toContain("resyncViewport");
  });

  it("omits script when autoInjectAgent is false", () => {
    const integration = relayAstro({ autoInjectAgent: false });
    let called = false;

    integration.hooks["astro:config:setup"]?.({
      injectScript: () => {
        called = true;
      },
      updateConfig: () => {},
    });

    expect(called).toBe(false);
  });
});
