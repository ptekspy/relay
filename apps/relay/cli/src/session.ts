import crypto from "node:crypto";
import {
  generateShortCode as generateProtocolShortCode,
  generateSessionToken,
} from "@paddy-systems/relay-protocol";
import QRCode from "qrcode";
import { RELAY_TOKEN_QUERY } from "./gateway.js";

export type TerminalQrSize = "compact" | "large";

export interface RelaySession {
  id: string;
  token: string;
  shortCode: string;
  createdAt: number;
  connectionUrl: string;
}

/**
 * Generates an alphanumeric short code in format XXX-XXX,
 * avoiding ambiguous characters (0, O, 1, I, L).
 */
export function generateShortCode(): string {
  const raw = generateProtocolShortCode(6);
  return `${raw.slice(0, 3)}-${raw.slice(3)}`;
}

/**
 * Creates a new Relay session with a cryptographic token and connection URL.
 */
export function createSession(host: string, gatewayPort: number): RelaySession {
  const id = `rl_${crypto.randomBytes(8).toString("hex")}`;
  const token = generateSessionToken();
  const shortCode = generateShortCode();
  const connectionUrl = `http://${host}:${gatewayPort}/?${RELAY_TOKEN_QUERY}=${token}`;

  return {
    id,
    token,
    shortCode,
    createdAt: Date.now(),
    connectionUrl,
  };
}

/**
 * Generates an ASCII/Unicode QR code string for terminal display.
 * Supports compact (half-block) and large (full-block) rendering for low-grade camera sensors.
 */
export async function renderTerminalQr(
  data: string,
  size: TerminalQrSize = "compact",
): Promise<string> {
  const compact = size === "compact";
  return new Promise((resolve, reject) => {
    QRCode.toString(
      data,
      {
        type: "terminal",
        small: compact,
        errorCorrectionLevel: "M",
        margin: compact ? 1 : 2,
      },
      (err, output) => {
        if (err) reject(err);
        else resolve(output);
      },
    );
  });
}
