/**
 * @paddy-systems/relay-docs
 * Documentation Portal, Spec Explorer & RFC System.
 */

export * from "./adr-system.js";
export * from "./api-schemas.js";
export * from "./diagnostic-tree.js";
export * from "./markdown-linter.js";
export * from "./metadata-seo.js";
export * from "./quickstart-guides.js";
export * from "./security-whitepaper.js";
export * from "./self-hosting.js";
export * from "./spec-explorer.js";
export * from "./types.js";

import { relayAdrManager } from "./adr-system.js";
import { relayApiSchemaProvider } from "./api-schemas.js";
import { relayPairingDiagnosticTree } from "./diagnostic-tree.js";
import { markdownDocLinter } from "./markdown-linter.js";
import { docsMetadataSeoGenerator } from "./metadata-seo.js";
import { relayFrameworkGuides } from "./quickstart-guides.js";
import { relaySecurityWhitepaper } from "./security-whitepaper.js";
import { relaySelfHostingGuide } from "./self-hosting.js";
import { relaySpecExplorer } from "./spec-explorer.js";

export class RelayDocsCoordinator {
  public specs = relaySpecExplorer;
  public adrs = relayAdrManager;
  public diagnostics = relayPairingDiagnosticTree;
  public guides = relayFrameworkGuides;
  public selfHosting = relaySelfHostingGuide;
  public security = relaySecurityWhitepaper;
  public apiSchemas = relayApiSchemaProvider;
  public linter = markdownDocLinter;
  public seo = docsMetadataSeoGenerator;
}
