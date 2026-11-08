import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Code } from "./Code.js";

describe("Code", () => {
  it("renders labelled code without copy controls by default", () => {
    const markup = renderToStaticMarkup(
      <Code label="Install command">bun install</Code>,
    );

    expect(markup).toContain('role="group"');
    expect(markup).toContain('aria-label="Install command"');
    expect(markup).toContain("bun install");
    expect(markup).not.toContain(">Copy<");
  });

  it("renders a copy control when copyable", () => {
    const markup = renderToStaticMarkup(
      <Code copyable copyClassName="copy-control">
        bun test
      </Code>,
    );

    expect(markup).toContain("bun test");
    expect(markup).toContain(">Copy<");
    expect(markup).toContain("copy-control");
  });
});
