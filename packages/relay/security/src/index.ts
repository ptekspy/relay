/**
 * @paddy-systems/relay-security
 * Security Governance, Attestation & Audit Vault.
 */

export * from "./constant-time.js";
export * from "./device-attestation.js";
export * from "./e2ee.js";
export * from "./entropy.js";
export * from "./lan-tls.js";
export * from "./merkle-vault.js";
export * from "./oauth-interceptor.js";
export * from "./pii-scanner.js";
export * from "./sri.js";
export * from "./ssrf-guard.js";
export * from "./types.js";

import { constantTimeComparator } from "./constant-time.js";
import { deviceAttestationEngine } from "./device-attestation.js";
import { endToEndEncryptionLayer } from "./e2ee.js";
import { entropyEvaluator } from "./entropy.js";
import { lanTlsBundleManager } from "./lan-tls.js";
import { cryptographicMerkleAuditVault } from "./merkle-vault.js";
import { oauthStateBridge } from "./oauth-interceptor.js";
import { piiScannerEngine } from "./pii-scanner.js";
import { sriHashGenerator } from "./sri.js";
import { ssrfTargetValidator } from "./ssrf-guard.js";

export class RelaySecurityCoordinator {
  public constantTime = constantTimeComparator;
  public entropy = entropyEvaluator;
  public sri = sriHashGenerator;
  public ssrf = ssrfTargetValidator;
  public pii = piiScannerEngine;
  public merkle = cryptographicMerkleAuditVault;
  public attestation = deviceAttestationEngine;
  public e2ee = endToEndEncryptionLayer;
  public oauth = oauthStateBridge;
  public lanTls = lanTlsBundleManager;
}
