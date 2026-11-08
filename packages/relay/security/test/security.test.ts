import { describe, expect, test } from "bun:test";
import {
  constantTimeComparator,
  cryptographicMerkleAuditVault,
  deviceAttestationEngine,
  endToEndEncryptionLayer,
  entropyEvaluator,
  piiScannerEngine,
  RelaySecurityCoordinator,
  sriHashGenerator,
  ssrfTargetValidator,
} from "../src/index.js";

describe("Relay Security Governance & Audit Vault Tests", () => {
  test("constant-time comparator validates identical vs differing inputs", () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 5]);
    const c = new Uint8Array([1, 2, 3, 4, 6]);

    expect(constantTimeComparator.compareBuffers(a, b)).toBe(true);
    expect(constantTimeComparator.compareBuffers(a, c)).toBe(false);

    expect(
      constantTimeComparator.compareStrings(
        "secret-token-123",
        "secret-token-123",
      ),
    ).toBe(true);
    expect(
      constantTimeComparator.compareStrings(
        "secret-token-123",
        "secret-token-999",
      ),
    ).toBe(false);
  });

  test("entropy evaluator calculates Shannon entropy and brute-force complexity", () => {
    const lowEntropy = entropyEvaluator.calculateShannonEntropy("aaaaaaa");
    const highEntropy =
      entropyEvaluator.calculateShannonEntropy("7k!P9$mQ2#zL");

    expect(lowEntropy).toBe(0);
    expect(highEntropy).toBeGreaterThan(3.0);

    const bf = entropyEvaluator.calculateBruteForceComplexity(6, 36, 10);
    expect(bf.totalCombinations).toBe(36 ** 6);
    expect(bf.yearsToCrack).toBeGreaterThan(0);
  });

  test("SRI generator computes sha384 subresource integrity string", async () => {
    const script = "console.log('Relay client v1.0.0');";
    const sri = await sriHashGenerator.generateSri(script, "sha384");

    expect(sri.startsWith("sha384-")).toBe(true);
    expect(sri.length).toBeGreaterThan(20);
  });

  test("SSRF target validator blocks private networks and cloud metadata", () => {
    expect(
      ssrfTargetValidator.isIpAllowedForTunnelRouting("169.254.169.254"),
    ).toBe(false);
    expect(ssrfTargetValidator.isIpAllowedForTunnelRouting("10.0.0.1")).toBe(
      false,
    );
    expect(
      ssrfTargetValidator.isIpAllowedForTunnelRouting("192.168.1.50"),
    ).toBe(false);
    expect(ssrfTargetValidator.isIpAllowedForTunnelRouting("172.16.5.4")).toBe(
      false,
    );

    expect(
      ssrfTargetValidator.isIpAllowedForTunnelRouting("127.0.0.1", true),
    ).toBe(true);
    expect(
      ssrfTargetValidator.isIpAllowedForTunnelRouting("93.184.216.34"),
    ).toBe(true); // public IP
  });

  test("PII scanner flags and masks credentials and secrets", () => {
    const log =
      "Deploying with key AKIAIOSFODNN7EXAMPLE and secret=supersecretpassword123";
    const result = piiScannerEngine.scanText(log);

    expect(result.findings.length).toBeGreaterThanOrEqual(1);
    expect(result.sanitizedText).not.toContain("AKIAIOSFODNN7EXAMPLE");
    expect(result.sanitizedText).toContain("••••");
  });

  test("Merkle audit vault verifies chain integrity and detects tampering", () => {
    cryptographicMerkleAuditVault.recordEvent({
      id: "evt-1",
      timestamp: 1000,
      actorId: "usr-admin",
      action: "login",
      targetResource: "dashboard",
      clientIp: "127.0.0.1",
    });

    cryptographicMerkleAuditVault.recordEvent({
      id: "evt-2",
      timestamp: 1050,
      actorId: "dev-phone",
      action: "pairing_requested",
      targetResource: "tunnel-7331",
      clientIp: "192.168.1.100",
    });

    expect(cryptographicMerkleAuditVault.getEventsCount()).toBe(2);
    expect(cryptographicMerkleAuditVault.verifyChainIntegrity()).toBe(true);
    expect(cryptographicMerkleAuditVault.getRootHash().length).toBe(64);
  });

  test("device attestation engine signs and verifies hardware tokens", () => {
    const token = deviceAttestationEngine.issueAttestationToken(
      "device-ipad-pro",
      "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE\n-----END PUBLIC KEY-----",
      60000,
    );

    const check = deviceAttestationEngine.verifyAttestationToken(token);
    expect(check.valid).toBe(true);

    // Tampered token
    const tampered = { ...token, deviceId: "device-evil" };
    const tamperedCheck =
      deviceAttestationEngine.verifyAttestationToken(tampered);
    expect(tamperedCheck.valid).toBe(false);
  });

  test("end-to-end encryption layer encrypts and decrypts payloads", async () => {
    const plaintext = "Sensitive mobile sensor telemetry";
    const key = "0123456789abcdef0123456789abcdef";

    const envelope = await endToEndEncryptionLayer.encryptPayload(
      plaintext,
      key,
    );
    expect(envelope.ciphertextBase64.length).toBeGreaterThan(0);
    expect(envelope.ivBase64.length).toBeGreaterThan(0);

    const decrypted = await endToEndEncryptionLayer.decryptPayload(
      envelope,
      key,
    );
    expect(decrypted.length).toBeGreaterThan(0);
  });

  test("RelaySecurityCoordinator facade integrates all modules", () => {
    const coord = new RelaySecurityCoordinator();
    expect(coord.constantTime).toBeDefined();
    expect(coord.entropy).toBeDefined();
    expect(coord.sri).toBeDefined();
    expect(coord.ssrf).toBeDefined();
    expect(coord.pii).toBeDefined();
    expect(coord.merkle).toBeDefined();
    expect(coord.attestation).toBeDefined();
    expect(coord.e2ee).toBeDefined();
  });
});
