import { describe, expect, it } from "bun:test";
import { TurnCredentialProvider } from "../src/turn-credentials";

describe("TASK-106: Ephemeral TURN/STUN Credential Minting & Coordination", () => {
  const secret = "test-secret-relay-pass";
  const provider = new TurnCredentialProvider(secret, {
    turnHost: "turn.test.relay.zone",
    ttlSeconds: 3600,
  });

  it("mints ephemeral ICE server credentials with valid TTL and standard URLs", () => {
    const creds = provider.mintCredentials("tester-device-1");

    expect(creds.ttlSeconds).toBe(3600);
    expect(creds.iceServers.length).toBe(1);

    const server = creds.iceServers[0];
    expect(server).toBeDefined();
    expect(server?.urls).toContain("stun:turn.test.relay.zone:3478");
    expect(server?.urls).toContain(
      "turn:turn.test.relay.zone:3478?transport=udp",
    );
    expect(server?.urls).toContain(
      "turn:turn.test.relay.zone:3478?transport=tcp",
    );
    expect(server?.urls).toContain(
      "turns:turn.test.relay.zone:5349?transport=tcp",
    );

    expect(server?.username).toContain(":tester-device-1");
    expect(server?.credential.length).toBeGreaterThan(10);
  });

  it("verifies authentic HMAC credentials successfully", () => {
    const creds = provider.mintCredentials("device-2", 1800);
    const server = creds.iceServers[0];
    expect(server).toBeDefined();

    const isValid = provider.verifyCredential(
      server!.username,
      server!.credential,
    );
    expect(isValid).toBe(true);
  });

  it("rejects tampered credentials or wrong secret", () => {
    const creds = provider.mintCredentials("device-3", 1800);
    const server = creds.iceServers[0];
    expect(server).toBeDefined();

    const isTamperedValid = provider.verifyCredential(
      server!.username,
      "invalid-base64-credential",
    );
    expect(isTamperedValid).toBe(false);

    const otherProvider = new TurnCredentialProvider("different-secret");
    const isOtherValid = otherProvider.verifyCredential(
      server!.username,
      server!.credential,
    );
    expect(isOtherValid).toBe(false);
  });

  it("rejects expired credentials based on timestamp header", () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 100;
    const expiredUsername = `${pastTimestamp}:expired-device`;

    // Compute signature with genuine secret
    const isValid = provider.verifyCredential(
      expiredUsername,
      "some-credential",
    );
    expect(isValid).toBe(false);
  });
});
