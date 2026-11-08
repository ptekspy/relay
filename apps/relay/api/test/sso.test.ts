import { describe, expect, it } from "bun:test";
import {
  EnterpriseSsoManager,
  type SsoConfiguration,
} from "../src/auth/sso.js";

describe("TASK-164: Enterprise SAML 2.0 / OIDC SSO Integration via Logto", () => {
  it("registers domain configuration and generates IdP redirect URL", () => {
    const sso = new EnterpriseSsoManager();
    const config: SsoConfiguration = {
      id: "sso-app-1",
      teamId: "team-acme",
      domain: "acme.corp",
      provider: "okta",
      issuer: "https://acme.okta.com",
      ssoEndpoint: "https://acme.okta.com/oauth2/v1/authorize",
      certOrPublicKey: "mock-cert",
      defaultRole: "ENGINEER",
      autoProvision: true,
    };

    sso.registerConfiguration(config);

    const retrieved = sso.findConfigurationByDomain("ACME.CORP");
    expect(retrieved?.id).toBe("sso-app-1");

    const loginUrl = sso.generateLoginUrl(
      "acme.corp",
      "https://relay.paddy.systems/auth/callback",
    );
    expect(loginUrl).toContain("https://acme.okta.com/oauth2/v1/authorize");
    expect(loginUrl).toContain("client_id=sso-app-1");
    expect(loginUrl).toContain("state=");
  });

  it("authenticates employee assertion and automatically provisions team seat", () => {
    const sso = new EnterpriseSsoManager();
    sso.registerConfiguration({
      id: "sso-app-2",
      teamId: "team-globex",
      domain: "globex.com",
      provider: "azure-ad",
      issuer: "https://login.microsoftonline.com",
      ssoEndpoint: "https://login.microsoftonline.com/authorize",
      certOrPublicKey: "key",
      defaultRole: "ENGINEER",
      autoProvision: true,
    });

    const assertionResult = sso.processAssertion("globex.com", {
      nameId: "usr-emp-101",
      email: "engineer@globex.com",
      displayName: "Jane Doe",
      groups: ["developers"],
    });

    expect(assertionResult.email).toBe("engineer@globex.com");
    expect(assertionResult.teamId).toBe("team-globex");
    expect(assertionResult.role).toBe("ENGINEER");
    expect(assertionResult.isNewUser).toBe(true);
    expect(assertionResult.sessionToken.startsWith("sso_tok_")).toBe(true);

    // Second login recognized as existing user
    const secondLogin = sso.processAssertion("globex.com", {
      nameId: "usr-emp-101",
      email: "engineer@globex.com",
    });
    expect(secondLogin.userId).toBe(assertionResult.userId);
    expect(secondLogin.isNewUser).toBe(false);
  });

  it("elevates role to ADMIN when corporate group contains relay-admins", () => {
    const sso = new EnterpriseSsoManager();
    sso.registerConfiguration({
      id: "sso-app-3",
      teamId: "team-corp",
      domain: "corp.net",
      provider: "google-workspace",
      issuer: "https://accounts.google.com",
      ssoEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      certOrPublicKey: "pubkey",
      defaultRole: "ENGINEER",
      autoProvision: true,
    });

    const result = sso.processAssertion("corp.net", {
      nameId: "usr-admin-1",
      email: "lead@corp.net",
      groups: ["engineers", "relay-admins"],
    });

    expect(result.role).toBe("ADMIN");
  });
});
