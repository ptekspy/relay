import crypto from "node:crypto";

export interface DeviceAuthorizationResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string;
  expiresIn: number;
  interval: number;
}

export type DevicePollStatus =
  | "authorization_pending"
  | "slow_down"
  | "expired"
  | "authorized";

interface DeviceSession {
  deviceCode: string;
  userCode: string;
  clientId: string;
  scope: string;
  userId?: string;
  accessToken?: string;
  createdAt: number;
  expiresAt: number;
  lastPolledAt: number;
  interval: number;
  isAuthorized: boolean;
}

export class DeviceFlowManager {
  private sessionsByDeviceCode = new Map<string, DeviceSession>();
  private deviceCodeByUserCode = new Map<string, string>();

  public initiate(
    clientId: string,
    scope = "relay:read relay:write",
    verificationBaseUri = "https://relay.paddy-systems.com/device",
  ): DeviceAuthorizationResponse {
    const deviceCode = crypto.randomBytes(32).toString("hex");
    // Generate 8-character user code: XXXX-XXXX (e.g. BCD2-K7L9)
    const rawChars = "BCDFGHJKLMNPQRSTVWXYZ23456789";
    let userCode = "";
    for (let i = 0; i < 8; i++) {
      if (i === 4) userCode += "-";
      userCode += rawChars[crypto.randomInt(rawChars.length)];
    }

    const expiresIn = 900; // 15 minutes
    const interval = 5; // 5 seconds
    const now = Date.now();

    const session: DeviceSession = {
      deviceCode,
      userCode,
      clientId,
      scope,
      createdAt: now,
      expiresAt: now + expiresIn * 1000,
      lastPolledAt: 0,
      interval,
      isAuthorized: false,
    };

    this.sessionsByDeviceCode.set(deviceCode, session);
    this.deviceCodeByUserCode.set(userCode.toUpperCase(), deviceCode);

    return {
      deviceCode,
      userCode,
      verificationUri: verificationBaseUri,
      verificationUriComplete: `${verificationBaseUri}?code=${encodeURIComponent(userCode)}`,
      expiresIn,
      interval,
    };
  }

  public authorize(userCode: string, userId: string): boolean {
    const deviceCode = this.deviceCodeByUserCode.get(userCode.toUpperCase());
    if (!deviceCode) return false;

    const session = this.sessionsByDeviceCode.get(deviceCode);
    if (!session || Date.now() > session.expiresAt) return false;

    session.userId = userId;
    session.isAuthorized = true;
    session.accessToken = `pst_tok_${crypto.randomBytes(24).toString("hex")}`;
    return true;
  }

  public poll(
    deviceCode: string,
    enforceRateLimit = true,
  ): { status: DevicePollStatus; accessToken?: string } {
    const session = this.sessionsByDeviceCode.get(deviceCode);
    if (!session || Date.now() > session.expiresAt) {
      return { status: "expired" };
    }

    const now = Date.now();
    if (
      enforceRateLimit &&
      session.lastPolledAt &&
      now - session.lastPolledAt < session.interval * 1000 - 500
    ) {
      session.interval += 5; // Increase interval per RFC 8628 §3.5
      return { status: "slow_down" };
    }
    session.lastPolledAt = now;

    if (session.isAuthorized && session.accessToken) {
      const token = session.accessToken;
      // Clean up after token issuance
      this.sessionsByDeviceCode.delete(deviceCode);
      this.deviceCodeByUserCode.delete(session.userCode.toUpperCase());
      return { status: "authorized", accessToken: token };
    }

    return { status: "authorization_pending" };
  }
}

export const defaultDeviceFlowManager = new DeviceFlowManager();
