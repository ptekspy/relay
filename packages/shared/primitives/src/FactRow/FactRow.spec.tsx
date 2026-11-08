import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FactRow } from "./FactRow.js";

describe("FactRow", () => {
  it("renders definition terms, values, and custom classes", () => {
    const markup = renderToStaticMarkup(
      <FactRow
        className="facts"
        items={[
          { term: "Status", value: "Available" },
          { term: "Version", value: <strong>1.0</strong> },
        ]}
      />,
    );

    expect(markup).toContain("<dl");
    expect(markup).toContain("facts");
    expect(markup).toContain("<dt");
    expect(markup).toContain("Status");
    expect(markup).toContain("Available");
    expect(markup).toContain("<strong>1.0</strong>");
  });
});
