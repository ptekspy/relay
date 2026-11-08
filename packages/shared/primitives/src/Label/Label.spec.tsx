import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Label } from "./Label.js";

describe("Label", () => {
  it.each(["span", "p", "div", "dt"] as const)(
    "supports the %s semantic element",
    (element) => {
      const markup = renderToStaticMarkup(
        <Label as={element} className="custom-label">
          Metadata
        </Label>,
      );

      expect(markup).toContain(`<${element}`);
      expect(markup).toContain("Metadata");
      expect(markup).toContain("label");
      expect(markup).toContain("custom-label");
    },
  );
});
