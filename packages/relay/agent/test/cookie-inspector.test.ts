import { describe, expect, it } from "bun:test";
import {
  type CookieDocument,
  CookieInspectorManager,
} from "../src/cookie-inspector.js";

describe("TASK-144: Cookie Inspector & Real-Time Cookie Modification", () => {
  it("parses raw document.cookie into structured cookie records", () => {
    const manager = new CookieInspectorManager();
    const doc: CookieDocument = {
      cookie:
        "sessionId=abc12345; userPreference=dark_mode; tracking_opt_out=true",
    };

    const cookies = manager.getCookies(doc);

    expect(cookies.length).toBe(3);
    expect(cookies[0]?.name).toBe("sessionId");
    expect(cookies[0]?.value).toBe("abc12345");
    expect(cookies[1]?.name).toBe("tracking_opt_out");
    expect(cookies[2]?.name).toBe("userPreference");
    expect(cookies[2]?.value).toBe("dark_mode");
  });

  it("formats and sets cookie with security and lifetime attributes", () => {
    const manager = new CookieInspectorManager();
    const doc: CookieDocument = { cookie: "" };

    const success = manager.setCookie(
      {
        name: "auth_token",
        value: "jwt.header.payload",
        path: "/api",
        secure: true,
        sameSite: "Strict",
        maxAge: 3600,
      },
      doc,
    );

    expect(success).toBe(true);
    expect(doc.cookie).toContain("auth_token=jwt.header.payload");
    expect(doc.cookie).toContain("Path=/api");
    expect(doc.cookie).toContain("Secure");
    expect(doc.cookie).toContain("SameSite=Strict");
    expect(doc.cookie).toContain("Max-Age=3600");
  });

  it("deletes cookie by expiring it immediately", () => {
    const manager = new CookieInspectorManager();
    const doc: CookieDocument = { cookie: "" };

    const deleted = manager.deleteCookie(
      "sessionId",
      "/app",
      "example.com",
      doc,
    );

    expect(deleted).toBe(true);
    expect(doc.cookie).toContain("sessionId=");
    expect(doc.cookie).toContain("Max-Age=0");
    expect(doc.cookie).toContain("Expires=Thu, 01 Jan 1970");
    expect(doc.cookie).toContain("Domain=example.com");
  });
});
