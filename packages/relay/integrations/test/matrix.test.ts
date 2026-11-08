import { describe, expect, it } from "bun:test";
import { FrameworkCompatibilityMatrix } from "../src/matrix.js";

describe("TASK-130: Framework Integration End-to-End Compatibility Matrix", () => {
  it("runs full compatibility matrix across Next.js, Nuxt, Vite, SvelteKit, and Astro with 100% pass rate", () => {
    const report = FrameworkCompatibilityMatrix.runFullMatrix();

    expect(report.totalFrameworks).toBe(5);
    expect(report.allPassed).toBe(true);

    const names = report.results.map((r) => r.framework);
    expect(names).toContain("nextjs");
    expect(names).toContain("nuxt");
    expect(names).toContain("vite");
    expect(names).toContain("sveltekit");
    expect(names).toContain("astro");

    for (const res of report.results) {
      expect(res.agentInjectionPassed).toBe(true);
      expect(res.portDetectionPassed).toBe(true);
      expect(res.frameworkFeaturesPassed).toBe(true);
      expect(res.hmrPassed).toBe(true);
      expect(res.latencyMs).toBeLessThan(250);
    }
  });
});
