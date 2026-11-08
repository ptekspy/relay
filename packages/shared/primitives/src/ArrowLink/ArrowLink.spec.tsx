import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArrowLink } from "./ArrowLink.js";

describe("ArrowLink", () => {
  it("renders an internal Next link with its arrow affordance", () => {
    const markup = renderToStaticMarkup(
      <ArrowLink href="/relay">Open Relay</ArrowLink>,
    );

    expect(markup).toContain('href="/relay"');
    expect(markup).toContain("Open Relay");
    expect(markup).toContain("group");
    expect(markup).toContain('aria-hidden="true"');
  });

  it("renders external destinations as regular anchors", () => {
    const markup = renderToStaticMarkup(
      <ArrowLink external href="https://relay.example">
        Visit Relay
      </ArrowLink>,
    );

    expect(markup).toContain('href="https://relay.example"');
    expect(markup).toContain("Visit Relay");
  });
});
