export interface LocalCertStatus {
  isInstalled: boolean;
  isTrusted: boolean;
  commonName: string;
  fingerprintSha256: string;
  expiresAt: string;
}

/**
 * Manages local self-signed CA certificate trust validation and status reporting.
 */
export class LocalCertificateTrustManager {
  private status: LocalCertStatus = {
    isInstalled: false,
    isTrusted: false,
    commonName: "Relay Local CA",
    fingerprintSha256:
      "E3:B0:C4:42:98:FC:1C:14:9A:FB:F4:C8:99:6F:B9:24:27:AE:41:E4:64:9B:93:4C:A4:95:99:1B:78:52:B8:55",
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };

  public getCertStatus(): LocalCertStatus {
    return { ...this.status };
  }

  public setTrustStatus(trusted: boolean): void {
    this.status.isInstalled = true;
    this.status.isTrusted = trusted;
  }

  public generateInstallInstructions(
    os: "macos" | "windows" | "linux",
  ): string {
    switch (os) {
      case "macos":
        return "sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain relay-ca.crt";
      case "windows":
        return 'certutil -addstore -f "ROOT" relay-ca.crt';
      case "linux":
        return "sudo cp relay-ca.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates";
    }
  }
}
