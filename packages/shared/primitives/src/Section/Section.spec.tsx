import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Section } from "./Section.js";

describe("Section", () => {
  it("renders indexed sections with a title and ghost numeral", () => {
    const markup = renderToStaticMarkup(
      <Section
        className="section-custom"
        id="intro"
        index="§ 03 - Intro"
        title="Welcome"
      >
        Content
      </Section>,
    );

    expect(markup).toContain('<section id="intro"');
    expect(markup).toContain("section-custom");
    expect(markup).toContain("§ 03 - Intro");
    expect(markup).toContain("Welcome");
    expect(markup).toContain("ghost-numeral");
    expect(markup).toContain(">03</span>");
    expect(markup).toContain("Content");
  });

  it("renders content without optional heading elements", () => {
    const markup = renderToStaticMarkup(<Section>Content only</Section>);

    expect(markup).toContain("Content only");
    expect(markup).not.toContain("ghost-numeral");
    expect(markup).not.toContain("<h2");
  });
});
