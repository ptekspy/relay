import crypto from "node:crypto";

/**
 * Enterprise SAML 2.0 / OIDC SSO Integration via Logto
 *
 * Configures enterprise identity federation (Okta, Azure AD, Google Workspace)
 * mapping corporate user directories and domains to Paddy Systems team seats.
 *
 * Note for Octavia: Used by the SSO authentication flow in Cloud Web and API.
 */

export type SsoProvider =
  | "okta"
  | "azure-ad"
  | "google-workspace"
  | "generic-saml";

export interface SsoConfiguration {
  id: string;
  teamId: string;
  domain: string; // e.g. "acme.corp"
  provider: SsoProvider;
  issuer: string;
  ssoEndpoint: string;
  certOrPublicKey: string;
  defaultRole: "ADMIN" | "ENGINEER" | "GUEST";
  autoProvision: boolean;
}

export interface SsoAssertionPayload {
  nameId: string;
  email: string;
  displayName?: string;
  groups?: string[];
  attributes?: Record<string, string>;
}

export interface SsoAuthResult {
  userId: string;
  email: string;
  teamId: string;
  role: string;
  isNewUser: boolean;
  sessionToken: string;
}

export class EnterpriseSsoManager {
  private configs = new Map<string, SsoConfiguration>();
  private provisionedUsers = new Map<
    string,
    { userId: string; teamId: string; role: string }
  >();

  public registerConfiguration(config: SsoConfiguration): void {
    this.configs.set(config.domain.toLowerCase(), config);
  }

  public findConfigurationByDomain(domain: string): SsoConfiguration | null {
    return this.configs.get(domain.toLowerCase()) ?? null;
  }

  public generateLoginUrl(domain: string, redirectUri: string): string {
    const config = this.findConfigurationByDomain(domain);
    if (!config) {
      throw new Error(`No SSO configuration found for domain: ${domain}`);
    }

    const state = crypto.randomBytes(16).toString("hex");
    return `${config.ssoEndpoint}?client_id=${config.id}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=openid%20profile%20email`;
  }

  public processAssertion(
    domain: string,
    assertion: SsoAssertionPayload,
  ): SsoAuthResult {
    const config = this.findConfigurationByDomain(domain);
    if (!config) {
      throw new Error(`SSO domain not configured: ${domain}`);
    }

    const email = assertion.email.toLowerCase();
    const existing = this.provisionedUsers.get(email);

    let userId: string;
    let role = config.defaultRole;
    let isNewUser = false;

    if (existing) {
      userId = existing.userId;
      role = existing.role as SsoConfiguration["defaultRole"];
    } else {
      if (!config.autoProvision) {
        throw new Error(
          `Auto-provisioning disabled for domain ${domain}. User not found.`,
        );
      }

      userId = `usr_sso_${crypto.randomBytes(8).toString("hex")}`;
      isNewUser = true;

      // Group-based role mapping if corporate group is admin
      if (
        assertion.groups?.includes("relay-admins") ||
        assertion.groups?.includes("Admins")
      ) {
        role = "ADMIN";
      }

      this.provisionedUsers.set(email, {
        userId,
        teamId: config.teamId,
        role,
      });
    }

    const sessionToken = `sso_tok_${crypto.randomBytes(24).toString("hex")}`;

    return {
      userId,
      email,
      teamId: config.teamId,
      role,
      isNewUser,
      sessionToken,
    };
  }
}
