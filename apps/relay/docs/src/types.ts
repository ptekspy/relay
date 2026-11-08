/**
 * @paddy-systems/relay-docs
 * Types for Documentation Portal, Spec Explorer & RFC System.
 */

export interface ProtocolSpecMessage {
  code: number;
  name: string;
  category: "control" | "telemetry" | "handshake" | "error";
  description: string;
  fields: Array<{ name: string; type: string; description: string }>;
}

export interface ArchitectureDecisionRecord {
  id: string; // e.g. "ADR-001"
  title: string;
  status: "accepted" | "proposed" | "deprecated" | "superseded";
  date: string;
  context: string;
  decision: string;
  consequences: string[];
}

export interface DiagnosticTreeNode {
  id: string;
  question: string;
  yesNextId?: string;
  noNextId?: string;
  remediationAdvice?: string;
}

export interface FrameworkGuide {
  slug: string;
  title: string;
  framework: string;
  installCommand: string;
  snippet: string;
  verifiedVersion: string;
}
