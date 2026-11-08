export interface ParsedDeviceMetadata {
  deviceType:
    | "mobile_browser"
    | "desktop_browser"
    | "android_native"
    | "ios_native"
    | "cli";
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  model: string;
}

export function parseUserAgentMetadata(ua: string): ParsedDeviceMetadata {
  const uaLower = ua.toLowerCase();

  // 1. Determine Device Type
  const isMobile =
    /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isIos = /iphone|ipad|ipod/i.test(ua);

  let deviceType: ParsedDeviceMetadata["deviceType"] = isMobile
    ? "mobile_browser"
    : "desktop_browser";
  if (ua.includes("RelayAndroid/")) deviceType = "android_native";
  else if (ua.includes("RelayIOS/")) deviceType = "ios_native";
  else if (
    uaLower.includes("curl") ||
    uaLower.includes("relay-cli") ||
    uaLower.includes("node") ||
    uaLower.includes("bun")
  ) {
    deviceType = "cli";
  }

  // 2. Determine OS
  let osName = "Unknown OS";
  let osVersion = "Unknown";
  if (isAndroid) {
    osName = "Android";
    const match = ua.match(/Android\s+([\d.]+)/i);
    if (match) osVersion = match[1] ?? "Unknown";
  } else if (isIos) {
    osName = "iOS";
    const match = ua.match(/OS\s+([\d_]+)/i);
    if (match) osVersion = (match[1] ?? "").replace(/_/g, ".");
  } else if (/macintosh|mac os x/i.test(ua)) {
    osName = "macOS";
    const match = ua.match(/Mac OS X\s+([\d_]+)/i);
    if (match) osVersion = (match[1] ?? "").replace(/_/g, ".");
  } else if (/windows/i.test(ua)) {
    osName = "Windows";
    const match = ua.match(/Windows NT\s+([\d.]+)/i);
    if (match) osVersion = match[1] ?? "Unknown";
  } else if (/linux/i.test(ua)) {
    osName = "Linux";
  }

  // 3. Determine Browser
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  if (/edg\//i.test(ua)) {
    browserName = "Edge";
    const match = ua.match(/Edg\/([\d.]+)/i);
    if (match) browserVersion = match[1] ?? "Unknown";
  } else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) {
    browserName = "Chrome";
    const match = ua.match(/(?:Chrome|CriOS)\/([\d.]+)/i);
    if (match) browserVersion = match[1] ?? "Unknown";
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browserName = "Safari";
    const match = ua.match(/Version\/([\d.]+)/i);
    if (match) browserVersion = match[1] ?? "Unknown";
  } else if (/firefox|fxios/i.test(ua)) {
    browserName = "Firefox";
    const match = ua.match(/(?:Firefox|FxiOS)\/([\d.]+)/i);
    if (match) browserVersion = match[1] ?? "Unknown";
  }

  // 4. Model extraction
  let model = osName;
  if (isIos) {
    if (/iphone/i.test(ua)) model = "Apple iPhone";
    else if (/ipad/i.test(ua)) model = "Apple iPad";
  } else if (isAndroid) {
    const modelMatch = ua.match(/;\s*([^;)]+)\s+Build\//);
    if (modelMatch?.[1]) {
      model = modelMatch[1].trim();
    } else {
      model = "Android Device";
    }
  }

  return {
    deviceType,
    browserName,
    browserVersion,
    osName,
    osVersion,
    model,
  };
}
