export interface CspOptions {
  nonce?: string;
}

export function detectCspNonce(): string | undefined {
  if (typeof document === "undefined") return undefined;

  // 1. Check meta tags
  const meta = document.querySelector(
    'meta[name="csp-nonce"], meta[property="csp-nonce"]',
  );
  if (meta) {
    const nonce = meta.getAttribute("content");
    if (nonce) return nonce;
  }

  // 2. Check existing script tags with nonce
  const scriptWithNonce = document.querySelector("script[nonce]");
  if (scriptWithNonce) {
    const nonce =
      scriptWithNonce.getAttribute("nonce") ||
      (scriptWithNonce as HTMLScriptElement).nonce;
    if (nonce) return nonce;
  }

  return undefined;
}

export function injectScriptWithCsp(
  src: string,
  options?: CspOptions,
): HTMLScriptElement {
  if (typeof document === "undefined") {
    throw new Error("injectScriptWithCsp requires a DOM document environment");
  }

  const script = document.createElement("script");
  script.src = src;
  script.async = true;

  const nonce = options?.nonce || detectCspNonce();
  if (nonce) {
    script.setAttribute("nonce", nonce);
    script.nonce = nonce;
  }

  (document.head || document.documentElement).appendChild(script);
  return script;
}
