import { describe, expect, it } from "bun:test";
import {
  generateCliReferenceMarkdown,
  generateManpage,
} from "../../scripts/generate-cli-manpage.js";

describe("Relay Documentation & Manpage Generator (TASK-P50)", () => {
  it("generates troff roff formatted manpage", () => {
    const manpage = generateManpage();
    expect(manpage).toContain(".TH RELAY 1");
    expect(manpage).toContain(".SH NAME");
    expect(manpage).toContain(".SH SYNOPSIS");
    expect(manpage).toContain("gateway\\-port");
  });

  it("generates markdown CLI reference", () => {
    const markdown = generateCliReferenceMarkdown();
    expect(markdown).toContain("# Relay CLI Command Reference");
    expect(markdown).toContain("relay completion");
    expect(markdown).toContain("--large-qr");
  });
});
