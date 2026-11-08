import type { PiiScanFinding } from "./types.js";

export class PiiScannerEngine {
  private static readonly RULES: Array<{
    name: string;
    pattern: RegExp;
    severity: PiiScanFinding["severity"];
  }> = [
    {
      name: "AWS Access Key",
      pattern: /(AKIA[0-9A-Z]{16})/g,
      severity: "critical",
    },
    {
      name: "JSON Web Token",
      pattern: /(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)/g,
      severity: "high",
    },
    {
      name: "Bearer Authorization Token",
      pattern: /Bearer\s+([A-Za-z0-9\-_.]{16,})/gi,
      severity: "high",
    },
    {
      name: "Generic Secret Key",
      pattern:
        /(?:api[_-]?key|secret|password)["']?\s*[:=]\s*["']([A-Za-z0-9+/=]{16,})["']/gi,
      severity: "critical",
    },
    {
      name: "Credit Card (Luhn format)",
      pattern: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
      severity: "critical",
    },
  ];

  public scanText(text: string): {
    findings: PiiScanFinding[];
    sanitizedText: string;
  } {
    const findings: PiiScanFinding[] = [];
    let sanitizedText = text;

    for (const rule of PiiScannerEngine.RULES) {
      // Reset regex state
      rule.pattern.lastIndex = 0;
      let match: RegExpExecArray | null = null;

      // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
      while ((match = rule.pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const secretPart = match[1] || fullMatch;
        const masked =
          secretPart.slice(0, 4) +
          "•".repeat(Math.max(4, secretPart.length - 8)) +
          secretPart.slice(-4);

        findings.push({
          patternName: rule.name,
          severity: rule.severity,
          matchedText: fullMatch,
          maskedText: masked,
          startIndex: match.index,
          endIndex: match.index + fullMatch.length,
        });

        sanitizedText = sanitizedText.replace(secretPart, masked);
      }
    }

    return { findings, sanitizedText };
  }
}

export const piiScannerEngine = new PiiScannerEngine();
