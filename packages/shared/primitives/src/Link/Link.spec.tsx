import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Link } from "./Link.js";

describe("Link", () => {
  it("renders Next Link with the shared button styling", () => {
    const markup: string = renderToStaticMarkup(
      <Link href="/relay">Open Relay</Link>,
    );

    expect(markup).toContain('href="/relay"');
    expect(markup).toContain("h-9");
    expect(markup).toContain("px-4");
    expect(markup).toContain("bg-primary-500");
  });

  it("removes control padding for text links", () => {
    const markup: string = renderToStaticMarkup(
      <Link className="font-semibold" href="/mirror" variant="text">
        Open Mirror
      </Link>,
    );

    expect(markup).toContain("p-0");
    expect(markup).not.toContain("px-4");
    expect(markup).not.toContain("py-2");
    expect(markup).toContain("font-semibold");
  });
});
