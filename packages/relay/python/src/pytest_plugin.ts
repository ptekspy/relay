export interface PytestDeviceFixtureConfig {
  device: "iphone-15" | "pixel-8" | "ipad";
  viewportWidth: number;
  viewportHeight: number;
  orientation: "portrait" | "landscape";
}

export class PytestRelayFixtureManager {
  public static getDeviceConfig(
    device: PytestDeviceFixtureConfig["device"],
  ): PytestDeviceFixtureConfig {
    switch (device) {
      case "iphone-15":
        return {
          device,
          viewportWidth: 393,
          viewportHeight: 852,
          orientation: "portrait",
        };
      case "pixel-8":
        return {
          device,
          viewportWidth: 412,
          viewportHeight: 915,
          orientation: "portrait",
        };
      case "ipad":
        return {
          device,
          viewportWidth: 834,
          viewportHeight: 1194,
          orientation: "portrait",
        };
    }
  }

  public static generatePytestSnippet(): string {
    return `
import pytest
from relay.pytest import relay_receiver

@pytest.mark.asyncio
async def test_mobile_checkout(relay_receiver):
    async with relay_receiver(device="iphone-15") as page:
        await page.goto("http://localhost:8000/cart")
        assert await page.is_visible("#checkout-btn")
`.trim();
  }
}
