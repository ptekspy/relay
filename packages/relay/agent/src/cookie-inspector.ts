/**
 * Cookie Inspector & Real-Time Cookie Modification
 *
 * Parses, inspects, and modifies browser cookies accessible to document.cookie
 * on remote receivers, enabling live session / auth debugging.
 *
 * Note for Octavia: This powers the Cookies panel in Cloud Web DevTools.
 */

export interface CookieRecord {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  maxAge?: number;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export interface CookieDocument {
  cookie: string;
}

export class CookieInspectorManager {
  public getCookies(
    doc: CookieDocument = typeof document !== "undefined"
      ? (document as unknown as CookieDocument)
      : { cookie: "" },
  ): CookieRecord[] {
    const raw = doc.cookie || "";
    if (!raw.trim()) {
      return [];
    }

    const records: CookieRecord[] = [];
    const pairs = raw.split(";");

    for (const pair of pairs) {
      const trimmed = pair.trim();
      if (!trimmed) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) {
        records.push({
          name: decodeURIComponent(trimmed),
          value: "",
        });
      } else {
        const name = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        records.push({
          name: decodeURIComponent(name),
          value: decodeURIComponent(value),
        });
      }
    }

    return records.sort((a, b) => a.name.localeCompare(b.name));
  }

  public setCookie(
    cookie: CookieRecord,
    doc: CookieDocument = typeof document !== "undefined"
      ? (document as unknown as CookieDocument)
      : { cookie: "" },
  ): boolean {
    if (!cookie.name) return false;

    let cookieStr = `${encodeURIComponent(cookie.name)}=${encodeURIComponent(cookie.value)}`;

    const path = cookie.path || "/";
    cookieStr += `; Path=${path}`;

    if (cookie.domain) {
      cookieStr += `; Domain=${cookie.domain}`;
    }

    if (typeof cookie.maxAge === "number") {
      cookieStr += `; Max-Age=${cookie.maxAge}`;
    }
    if (cookie.expires) {
      cookieStr += `; Expires=${cookie.expires}`;
    }

    if (cookie.secure) {
      cookieStr += "; Secure";
    }

    if (cookie.sameSite) {
      cookieStr += `; SameSite=${cookie.sameSite}`;
    }

    try {
      doc.cookie = cookieStr;
      return true;
    } catch {
      return false;
    }
  }

  public deleteCookie(
    name: string,
    path = "/",
    domain?: string,
    doc: CookieDocument = typeof document !== "undefined"
      ? (document as unknown as CookieDocument)
      : { cookie: "" },
  ): boolean {
    return this.setCookie(
      {
        name,
        value: "",
        path,
        domain,
        maxAge: 0,
        expires: "Thu, 01 Jan 1970 00:00:00 GMT",
      },
      doc,
    );
  }
}
