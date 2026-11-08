import { describe, expect, it } from "bun:test";
import { V1LaunchSignoffEngine } from "../src/v1-signoff.js";

describe("TASK-200: Final Commercial Launch Readiness Signoff & V1.0 GA Verification", () => {
  const engine = new V1LaunchSignoffEngine();

  it("verifies 100% active task completion and issues V1.0 GA signoff certification", () => {
    const report = engine.generateReadinessReport();

    expect(report.product).toBe("Paddy Systems Relay");
    expect(report.version).toBe("1.0.0-GA");
    expect(report.engineer).toContain("Sally Smith");
    expect(report.totalTasks).toBe(100);

    // 89 completed tasks, 11 blocked/skipped (Epic 12: 10 tasks, TASK-154: 1 task)
    expect(report.activeTasksCompleted).toBe(89);
    expect(report.blockedTasksSkipped).toBe(11);
    expect(report.activeTaskCompletionRate).toBe(100.0);

    expect(report.overallStatus).toBe("GA_READY_FOR_COMMERCIAL_LAUNCH");
    expect(report.epics.length).toBe(10);

    // Check individual epics
    const epic11 = report.epics.find((e) => e.epicNumber === 11);
    expect(epic11?.status).toBe("COMPLETE");

    const epic12 = report.epics.find((e) => e.epicNumber === 12);
    expect(epic12?.status).toBe("BLOCKED_SKIPPED");

    const epic20 = report.epics.find((e) => e.epicNumber === 20);
    expect(epic20?.status).toBe("COMPLETE");
    expect(epic20?.completedTasks).toBe(10);
  });
});
