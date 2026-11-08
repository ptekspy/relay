import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Container } from "./Container.js";

describe("Container", () => {
  it("renders its children with the shared layout classes", () => {
    const markup = renderToStaticMarkup(
      <Container className="custom-width">Content</Container>,
    );

    expect(markup).toContain("Content");
    expect(markup).toContain("mx-auto");
    expect(markup).toContain("max-w-[1440px]");
    expect(markup).toContain("custom-width");
  });
});
