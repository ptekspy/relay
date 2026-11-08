import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, ButtonOld } from "./Button.js";

describe("Button", () => {
  it("renders shared control styling and defaults to button type", () => {
    const markup: string = renderToStaticMarkup(<Button>Continue</Button>);

    expect(markup).toContain('type="button"');
    expect(markup).toContain("h-9");
    expect(markup).toContain("px-4");
    expect(markup).toContain("bg-primary-500");
  });

  it("supports variants and class name overrides", () => {
    const markup: string = renderToStaticMarkup(
      <Button className="w-full" size="lg" variant="success">
        Continue
      </Button>,
    );

    expect(markup).toContain("text-lg");
    expect(markup).toContain("bg-success");
    expect(markup).toContain("w-full");
  });

  it.each([
    ["solid", 'href="/relay"'],
    ["outline", 'href="https://relay.example"'],
    ["invert", 'href="/mirror"'],
  ] as const)("renders the legacy %s link variant", (variant, href) => {
    const markup: string = renderToStaticMarkup(
      <ButtonOld
        external={variant === "outline"}
        href={href.slice(6, -1)}
        variant={variant}
      >
        Open
      </ButtonOld>,
    );

    expect(markup).toContain(href);
    expect(markup).toContain("Open");
    expect(markup).toContain("sheen-layer");
  });
});
