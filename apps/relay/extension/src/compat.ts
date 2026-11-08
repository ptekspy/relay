export type BrowserVendor = "chrome" | "firefox" | "safari" | "edge";

export class BrowserExtensionCompat {
  public static detectVendor(userAgentString?: string): BrowserVendor {
    const ua =
      userAgentString ||
      (typeof navigator !== "undefined" ? navigator.userAgent : "");

    if (ua.includes("Firefox")) return "firefox";
    if (ua.includes("Edg/")) return "edge";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
    return "chrome";
  }

  public static getNamespace(): "chrome" | "browser" {
    if (
      typeof (globalThis as Record<string, unknown>).browser !== "undefined"
    ) {
      return "browser";
    }
    return "chrome";
  }
}
