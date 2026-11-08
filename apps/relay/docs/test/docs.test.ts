import { describe, expect, test } from "bun:test";
import {
  docsMetadataSeoGenerator,
  markdownDocLinter,
  RelayDocsCoordinator,
  relayAdrManager,
  relayApiSchemaProvider,
  relayFrameworkGuides,
  relayPairingDiagnosticTree,
  relaySecurityWhitepaper,
  relaySelfHostingGuide,
  relaySpecExplorer,
} from "../src/index.js";

describe("Relay Documentation Portal, Spec Explorer & RFC System Tests", () => {
  test("spec explorer lists messages and filters by code/category", () => {
    const all = relaySpecExplorer.listMessages();
    expect(all.length).toBeGreaterThanOrEqual(4);

    const clientHello = relaySpecExplorer.getMessageByCode(0x01);
    expect(clientHello).toBeDefined();
    expect(clientHello?.name).toBe("ClientHello");

    const telemetryMsgs = relaySpecExplorer.getMessagesByCategory("telemetry");
    expect(telemetryMsgs.length).toBeGreaterThanOrEqual(1);
  });

  test("ADR manager indexes architecture decisions and performs full-text search", () => {
    const adrs = relayAdrManager.listAdrs();
    expect(adrs.length).toBeGreaterThanOrEqual(5);

    const adr1 = relayAdrManager.getAdrById("ADR-001");
    expect(adr1?.status).toBe("accepted");

    const searchResults = relayAdrManager.searchAdrs("WebAssembly");
    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    expect(searchResults[0]?.id).toBe("ADR-005");
  });

  test("pairing diagnostic tree navigates troubleshooting paths to remediation advice", () => {
    const root = relayPairingDiagnosticTree.getRootNode();
    expect(root.id).toBe("start");

    const noWifiNode = relayPairingDiagnosticTree.getNode("switch_wifi");
    expect(noWifiNode?.remediationAdvice).toContain("relay dev --tunnel");
  });

  test("framework guides provide verified snippets for top frameworks", () => {
    const nextjs = relayFrameworkGuides.getGuideBySlug("nextjs");
    expect(nextjs).toBeDefined();
    expect(nextjs?.snippet).toContain("withRelay");

    const django = relayFrameworkGuides.getGuideBySlug("django");
    expect(django).toBeDefined();
    expect(django?.snippet).toContain("RelayScriptInjectionMiddleware");
  });

  test("self-hosting guide generates valid Docker Compose and Kubernetes manifests", () => {
    const dockerCompose = relaySelfHostingGuide.getDockerComposeTemplate();
    expect(dockerCompose).toContain(
      "image: ghcr.io/paddy-systems/relay-edge:latest",
    );
    expect(dockerCompose).toContain("image: coturn/coturn:latest");

    const k8s = relaySelfHostingGuide.getKubernetesManifestTemplate();
    expect(k8s).toContain("kind: Deployment");
    expect(k8s).toContain("name: relay-edge-gateway");
  });

  test("security whitepaper documents zero-trust threat vectors", () => {
    expect(
      relaySecurityWhitepaper.getThreatVectors().length,
    ).toBeGreaterThanOrEqual(3);
    expect(relaySecurityWhitepaper.getSummary()).toContain("zero-trust");
  });

  test("API schema provider returns valid OpenAPI 3.1 and AsyncAPI 3.0 structures", () => {
    const openapi = relayApiSchemaProvider.getOpenApiSchema();
    expect(openapi.openapi).toBe("3.1.0");

    const asyncapi = relayApiSchemaProvider.getAsyncApiSchema();
    expect(asyncapi.asyncapi).toBe("3.0.0");
  });

  test("markdown linter catches malformed links and unclosed code blocks", () => {
    const valid =
      "# Title\n\n[Link](https://example.com)\n\n```ts\nconst x = 1;\n```";
    expect(markdownDocLinter.validateDocument(valid).valid).toBe(true);

    const malformed = "# Title\n\n[Empty link]()\n\n```ts\nlet unclosed;";
    const check = markdownDocLinter.validateDocument(malformed);
    expect(check.valid).toBe(false);
    expect(check.errors.length).toBe(2);
  });

  test("metadata SEO generator produces robots.txt, sitemap.xml, and OpenGraph tags", () => {
    const robots = docsMetadataSeoGenerator.generateRobotsTxt();
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Sitemap: https://relay.live/sitemap.xml");

    const sitemap = docsMetadataSeoGenerator.generateSitemapXml([
      "/docs",
      "/docs/quickstart",
    ]);
    expect(sitemap).toContain("<loc>https://relay.live/docs</loc>");

    const og = docsMetadataSeoGenerator.generateOpenGraphTags(
      "Getting Started",
      "Quickstart guide",
      "/docs/getting-started",
    );
    expect(og["og:title"]).toContain("Getting Started");
  });

  test("RelayDocsCoordinator facade integrates all modules", () => {
    const coord = new RelayDocsCoordinator();
    expect(coord.specs).toBeDefined();
    expect(coord.adrs).toBeDefined();
    expect(coord.diagnostics).toBeDefined();
    expect(coord.guides).toBeDefined();
    expect(coord.selfHosting).toBeDefined();
    expect(coord.security).toBeDefined();
    expect(coord.apiSchemas).toBeDefined();
    expect(coord.linter).toBeDefined();
    expect(coord.seo).toBeDefined();
  });
});
