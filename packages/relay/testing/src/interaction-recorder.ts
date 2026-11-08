/**
 * Automated Mobile Device Touch Interaction Recorder & Script Generator
 *
 * Converts recorded mobile touch/tap/swipe/input events into ready-to-run
 * Playwright or Puppeteer .spec.ts test scripts.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-testing/interaction-recorder.
 */

export interface RecordedInteraction {
  type: "tap" | "swipe" | "input" | "navigate" | "scroll";
  selector?: string;
  url?: string;
  text?: string;
  coordinates?: {
    startX: number;
    startY: number;
    endX?: number;
    endY?: number;
  };
  timestamp: number;
}

export interface ScriptGeneratorOptions {
  testName?: string;
  baseUrl?: string;
  deviceEmulation?: string;
}

export class InteractionScriptGenerator {
  public generatePlaywrightSpec(
    interactions: RecordedInteraction[],
    options?: ScriptGeneratorOptions,
  ): string {
    const testName = options?.testName ?? "Recorded Mobile Interaction Flow";
    const lines: string[] = [
      'import { test, expect, devices } from "@playwright/test";',
      "",
    ];

    if (options?.deviceEmulation) {
      lines.push(
        `test.use({ ...devices[${JSON.stringify(options.deviceEmulation)}] });`,
        "",
      );
    }

    lines.push(`test(${JSON.stringify(testName)}, async ({ page }) => {`);

    for (const action of interactions) {
      switch (action.type) {
        case "navigate": {
          const targetUrl = action.url ?? options?.baseUrl ?? "/";
          lines.push(`  await page.goto(${JSON.stringify(targetUrl)});`);
          break;
        }
        case "tap": {
          if (action.selector) {
            lines.push(
              `  await page.click(${JSON.stringify(action.selector)});`,
            );
          } else if (action.coordinates) {
            lines.push(
              `  await page.mouse.click(${action.coordinates.startX}, ${action.coordinates.startY});`,
            );
          }
          break;
        }
        case "input": {
          if (action.selector) {
            lines.push(
              `  await page.fill(${JSON.stringify(action.selector)}, ${JSON.stringify(action.text ?? "")});`,
            );
          }
          break;
        }
        case "swipe": {
          if (
            action.coordinates &&
            action.coordinates.endX !== undefined &&
            action.coordinates.endY !== undefined
          ) {
            lines.push(
              `  // Swipe gesture from (${action.coordinates.startX}, ${action.coordinates.startY}) to (${action.coordinates.endX}, ${action.coordinates.endY})`,
              `  await page.mouse.move(${action.coordinates.startX}, ${action.coordinates.startY});`,
              "  await page.mouse.down();",
              `  await page.mouse.move(${action.coordinates.endX}, ${action.coordinates.endY}, { steps: 5 });`,
              "  await page.mouse.up();",
            );
          }
          break;
        }
        case "scroll": {
          lines.push(
            `  await page.evaluate(() => window.scrollBy(0, ${action.coordinates?.endY ?? 300}));`,
          );
          break;
        }
      }
    }

    lines.push("});", "");
    return lines.join("\n");
  }

  public generatePuppeteerSpec(
    interactions: RecordedInteraction[],
    options?: ScriptGeneratorOptions,
  ): string {
    const testName = options?.testName ?? "Recorded Mobile Interaction Flow";
    const lines: string[] = [
      'import puppeteer from "puppeteer";',
      "",
      `describe(${JSON.stringify(testName)}, () => {`,
      '  it("executes recorded flow", async () => {',
      "    const browser = await puppeteer.launch();",
      "    const page = await browser.newPage();",
    ];

    for (const action of interactions) {
      switch (action.type) {
        case "navigate": {
          lines.push(
            `    await page.goto(${JSON.stringify(action.url ?? "/")});`,
          );
          break;
        }
        case "tap": {
          if (action.selector) {
            lines.push(
              `    await page.click(${JSON.stringify(action.selector)});`,
            );
          }
          break;
        }
        case "input": {
          if (action.selector) {
            lines.push(
              `    await page.type(${JSON.stringify(action.selector)}, ${JSON.stringify(action.text ?? "")});`,
            );
          }
          break;
        }
      }
    }

    lines.push("    await browser.close();", "  });", "});", "");

    return lines.join("\n");
  }
}
