import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Prose } from "./Prose.js";

describe("Prose", () => {
  it("renders rich content with readable prose styling", () => {
    const markup = renderToStaticMarkup(
      <Prose className="article-copy">
        <h3>Heading</h3>
        <p>Body copy</p>
        <ul>
          <li>First point</li>
        </ul>
      </Prose>,
    );

    expect(markup).toContain("article-copy");
    expect(markup).toContain("max-w-[68ch]");
    expect(markup).toContain("<h3>Heading</h3>");
    expect(markup).toContain("First point");
  });
});
