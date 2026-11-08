import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Typography } from "./Typography.js";

describe("Typography", () => {
  it("renders semantic default typography styles", () => {
    const markup: string = renderToStaticMarkup(
      <Typography>Typography</Typography>,
    );

    expect(markup).toContain("font-sans");
    expect(markup).toContain("text-base");
    expect(markup).toContain("font-normal");
    expect(markup).toContain("text-foreground-950");
  });

  it("renders variants and appends class name overrides", () => {
    const markup: string = renderToStaticMarkup(
      <Typography
        as="h1"
        className="tracking-tight"
        color="success"
        size="4xl"
        weight="bold"
      >
        Typography
      </Typography>,
    );

    expect(markup).toContain("<h1");
    expect(markup).toContain("text-4xl");
    expect(markup).toContain("font-bold");
    expect(markup).toContain("text-success");
    expect(markup).toContain("tracking-tight");
  });
});
