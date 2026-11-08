import { describe, expect, it } from "bun:test";
import {
  type RelayPlaywrightAction,
  RelayPlaywrightConnector,
} from "../src/playwright-transport.js";

describe("TASK-182: Playwright Transport Provider for Relay Connected Devices", () => {
  it("connects to physical device and drives navigation and interactions", async () => {
    const executedActions: RelayPlaywrightAction[] = [];

    const page = await RelayPlaywrightConnector.connect({
      tunnelUrl: "https://sess_test.relay.paddy.systems",
      mockDevice: {
        id: "dev_iphone_15",
        name: "iPhone 15 Pro",
        platform: "ios",
        viewport: { width: 393, height: 852 },
      },
      customSender: async (action) => {
        executedActions.push(action);
        if (action.action === "evaluate") {
          return {
            success: true,
            executionMs: 5,
            value: { innerWidth: 393, innerHeight: 852 },
          };
        }
        return { success: true, executionMs: 8 };
      },
    });

    expect(page.device.name).toBe("iPhone 15 Pro");
    expect(page.device.platform).toBe("ios");

    // 1. Navigation
    const nav = await page.goto(
      "https://sess_test.relay.paddy.systems/checkout",
    );
    expect(nav.status).toBe(200);
    expect(page.url()).toBe("https://sess_test.relay.paddy.systems/checkout");

    // 2. Click & Type
    const clickSuccess = await page.click("button#pay-now");
    expect(clickSuccess).toBe(true);

    const typeSuccess = await page.type("input#coupon", "DISCOUNT50");
    expect(typeSuccess).toBe(true);

    // 3. Evaluate expression
    const viewportMetrics = await page.evaluate<{ innerWidth: number }>(
      "window.innerWidth",
    );
    expect(viewportMetrics.innerWidth).toBe(393);

    // 4. Verify all actions reached physical receiver transport
    expect(executedActions.map((a) => a.action)).toEqual([
      "goto",
      "click",
      "type",
      "evaluate",
    ]);
  });

  it("handles remote device interaction errors gracefully", async () => {
    const page = await RelayPlaywrightConnector.connect({
      tunnelUrl: "https://sess_test.relay.paddy.systems",
      customSender: async () => ({
        success: false,
        error: "Element not interactable or obscured by backdrop",
        executionMs: 15,
      }),
    });

    expect(page.click(".obscured-btn")).rejects.toThrow(
      "Element not interactable or obscured by backdrop",
    );
  });
});
