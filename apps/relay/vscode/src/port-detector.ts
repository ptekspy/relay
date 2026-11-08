export interface PortScanResult {
  port: number;
  isOpen: boolean;
  serviceGuess?: string;
}

/**
 * Scans common developer ports (3000, 5173, 8080, 4321) to detect active web frameworks.
 */
export class DevPortDetector {
  public static readonly COMMON_PORTS = [3000, 5173, 8080, 8000, 4321, 1420];

  public detectFramework(port: number, bannerText?: string): string {
    if (bannerText) {
      if (bannerText.includes("vite")) return "Vite";
      if (bannerText.includes("next")) return "Next.js";
      if (bannerText.includes("remix")) return "Remix";
      if (bannerText.includes("astro")) return "Astro";
    }

    if (port === 5173) return "Vite";
    if (port === 3000) return "Next.js / React";
    if (port === 4321) return "Astro";
    return "Web Dev Server";
  }

  public shouldPromptUser(
    detectedPort: number,
    alreadyKnownPorts: number[],
  ): boolean {
    return !alreadyKnownPorts.includes(detectedPort);
  }
}
