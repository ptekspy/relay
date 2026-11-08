/**
 * Redaction of Sensitive Fields in Pixel Stream (Canvas Masking)
 *
 * Scans the active DOM tree for password inputs, credit card numbers, and
 * elements tagged with `data-relay-private`, painting blackout masks over
 * sensitive pixel coordinates before frame encoding.
 *
 * Note for Octavia: Used directly in the video capture pipeline.
 */

export interface MaskingRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  reason: "password" | "credit-card" | "data-private" | "custom";
  label?: string;
}

export interface RedactionMaskOptions {
  fillColor?: string;
  drawPlaceholderText?: boolean;
}

export interface Canvas2DContextLike {
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  font?: string;
  fillText?: (text: string, x: number, y: number) => void;
}

export class PixelStreamRedactor {
  public static readonly SENSITIVE_SELECTORS = [
    'input[type="password"]',
    "[data-relay-private]",
    "[data-private]",
    ".relay-private",
    'input[autocomplete*="cc-"]',
    'input[name*="card"]',
    'input[name*="cvv"]',
    'input[name*="cvc"]',
  ];

  public static queryMaskingRegions(doc: Document = document): MaskingRegion[] {
    const regions: MaskingRegion[] = [];
    if (!doc.querySelectorAll) return regions;

    for (const selector of PixelStreamRedactor.SENSITIVE_SELECTORS) {
      try {
        const elements = doc.querySelectorAll(selector);
        for (const el of Array.from(elements)) {
          if (!el.getBoundingClientRect) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            let reason: MaskingRegion["reason"] = "data-private";
            if (selector.includes("password")) reason = "password";
            else if (
              selector.includes("card") ||
              selector.includes("cc-") ||
              selector.includes("cv")
            ) {
              reason = "credit-card";
            }

            regions.push({
              x: Math.round(rect.left),
              y: Math.round(rect.top),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              reason,
              label: `[REDACTED: ${reason.toUpperCase()}]`,
            });
          }
        }
      } catch {
        // Selector error
      }
    }

    return regions;
  }

  public static applyMask(
    ctx: Canvas2DContextLike,
    regions: MaskingRegion[],
    options: RedactionMaskOptions = {},
  ): void {
    const fillColor = options.fillColor ?? "#0f172a";
    const drawText = options.drawPlaceholderText ?? true;

    for (const region of regions) {
      ctx.fillStyle = fillColor;
      ctx.fillRect(region.x, region.y, region.width, region.height);

      if (drawText && ctx.fillText && region.width > 60 && region.height > 16) {
        ctx.fillStyle = "#ffffff";
        if (ctx.font) ctx.font = "10px sans-serif";
        ctx.fillText(
          region.label ?? "[REDACTED]",
          region.x + 4,
          region.y + Math.min(region.height - 4, 14),
        );
      }
    }
  }
}
