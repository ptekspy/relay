import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Status } from "./Status.js";

describe("Status", () => {
  it.each([
    ["AVAILABLE NOW", "text-blue"],
    ["IN DEVELOPMENT", "text-violet"],
    ["UNANNOUNCED", "text-magenta"],
    ["UNKNOWN", "text-foreground"],
  ])("uses the %s tone", (value, tone) => {
    const markup = renderToStaticMarkup(
      <Status className="status-custom" value={value} />,
    );

    expect(markup).toContain(value);
    expect(markup).toContain(tone);
    expect(markup).toContain("status-custom");
  });
});
