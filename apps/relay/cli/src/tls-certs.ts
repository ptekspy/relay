import { generateKeyPairSync } from "node:crypto";
import {
  DEFAULT_LAN_APEX_DOMAIN,
  ipToLanDomain,
  type LanTlsBundle,
  LanTlsBundleManager,
} from "@paddy-systems/relay-security";

export interface TlsCertificateBundle {
  key: string;
  cert: string;
  isTrustedWildcard?: boolean;
  domain?: string;
}

/**
 * Creates or retrieves a development TLS certificate for local HTTPS testing.
 */
export function generateDevCertificate(
  _host = "localhost",
): TlsCertificateBundle {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return {
    key: privateKey,
    cert: publicKey,
    isTrustedWildcard: false,
    domain: _host,
  };
}

/**
 * Retrieves or provisions a LAN TLS wildcard certificate bundle for the specified local IP.
 */
export async function getOrProvisionLanCertificate(
  lanIp: string,
  apexDomain = DEFAULT_LAN_APEX_DOMAIN,
): Promise<TlsCertificateBundle> {
  const manager = new LanTlsBundleManager(apexDomain);
  const bundle: LanTlsBundle = await manager.getOrProvisionBundle(lanIp);

  return {
    key: bundle.key,
    cert: bundle.cert,
    isTrustedWildcard: bundle.isTrustedWildcard,
    domain: bundle.isTrustedWildcard
      ? `*.${apexDomain}`
      : ipToLanDomain(lanIp, apexDomain),
  };
}
