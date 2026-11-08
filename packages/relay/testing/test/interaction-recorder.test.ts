import { describe, expect, it } from "bun:test";
import {
  InteractionScriptGenerator,
  type RecordedInteraction,
} from "../src/interaction-recorder.js";

describe("TASK-185: Automated Mobile Device Touch Interaction Recorder & Script Generator", () => {
  const generator = new InteractionScriptGenerator();

  const interactions: RecordedInteraction[] = [
    {
      type: "navigate",
      url: "https://shop.relay.paddy.systems",
      timestamp: 1000,
    },
    {
      type: "tap",
      selector: "button#menu-toggle",
      timestamp: 1500,
    },
    {
      type: "input",
      selector: "input#search",
      text: "Mechanical Keyboard",
      timestamp: 2000,
    },
    {
      type: "swipe",
      coordinates: { startX: 200, startY: 600, endX: 200, endY: 100 },
      timestamp: 3000,
    },
    {
      type: "scroll",
      coordinates: { startX: 0, startY: 0, endY: 500 },
      timestamp: 3500,
    },
  ];

  it("exports valid ready-to-run Playwright .spec.ts code", () => {
    const spec = generator.generatePlaywrightSpec(interactions, {
      testName: "Mobile Checkout Flow Verification",
      deviceEmulation: "Pixel 7",
    });

    expect(spec).toContain(
      'import { test, expect, devices } from "@playwright/test";',
    );
    expect(spec).toContain('test.use({ ...devices["Pixel 7"] });');
    expect(spec).toContain('test("Mobile Checkout Flow Verification"');
    expect(spec).toContain(
      'await page.goto("https://shop.relay.paddy.systems");',
    );
    expect(spec).toContain('await page.click("button#menu-toggle");');
    expect(spec).toContain(
      'await page.fill("input#search", "Mechanical Keyboard");',
    );
    expect(spec).toContain("await page.mouse.move(200, 600);");
    expect(spec).toContain("await page.mouse.down();");
    expect(spec).toContain("await page.mouse.move(200, 100, { steps: 5 });");
    expect(spec).toContain("await page.mouse.up();");
    expect(spec).toContain("window.scrollBy(0, 500)");
  });

  it("handles coordinate-based tap clicks when selector is undefined", () => {
    const rawCoords: RecordedInteraction[] = [
      {
        type: "tap",
        coordinates: { startX: 180, startY: 340 },
        timestamp: 1200,
      },
    ];

    const spec = generator.generatePlaywrightSpec(rawCoords);
    expect(spec).toContain("await page.mouse.click(180, 340);");
  });

  it("exports Puppeteer compatible test script", () => {
    const spec = generator.generatePuppeteerSpec(interactions);

    expect(spec).toContain('import puppeteer from "puppeteer";');
    expect(spec).toContain("const browser = await puppeteer.launch();");
    expect(spec).toContain(
      'await page.goto("https://shop.relay.paddy.systems");',
    );
    expect(spec).toContain('await page.click("button#menu-toggle");');
    expect(spec).toContain(
      'await page.type("input#search", "Mechanical Keyboard");',
    );
    expect(spec).toContain("await browser.close();");
  });
});
