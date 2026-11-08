import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalTlsCertManager } from "../src/mkcert.js";

describe("TASK-128: HTTPS Self-Signed CA Trust Generator (mkcert Integration)", () => {
  it("generates TLS certificates with valid PEM structure", () => {
    const testDir = join(tmpdir(), `relay-test-certs-${Date.now()}`);
    const result = LocalTlsCertManager.generateCert(
      ["localhost", "192.168.1.55"],
      testDir,
    );

    expect(existsSync(result.certPath)).toBe(true);
    expect(existsSync(result.keyPath)).toBe(true);
    expect(result.domains).toEqual(["localhost", "192.168.1.55"]);

    const certContent = readFileSync(result.certPath, "utf-8");
    const keyContent = readFileSync(result.keyPath, "utf-8");

    expect(certContent).toContain("-----BEGIN CERTIFICATE-----");
    expect(keyContent).toContain("-----BEGIN PRIVATE KEY-----");

    // Clean up
    rmSync(testDir, { recursive: true, force: true });
  });

  it("produces comprehensive mobile onboarding instructions for iOS and Android", () => {
    const instructions = LocalTlsCertManager.getMobileInstructions(
      "192.168.1.42",
      7331,
    );

    expect(instructions.ios.platform).toBe("ios");
    expect(instructions.ios.caDownloadUrl).toBe(
      "http://192.168.1.42:7331/__relay/rootCA.pem",
    );
    expect(instructions.ios.steps.length).toBeGreaterThanOrEqual(4);
    expect(instructions.ios.steps[2]).toContain("Certificate Trust Settings");

    expect(instructions.android.platform).toBe("android");
    expect(instructions.android.steps[1]).toContain("Encryption & Credentials");
  });
});
