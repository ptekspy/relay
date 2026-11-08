import { describe, expect, it } from "bun:test";
import {
  RELAY_PRODUCTION_SLOS,
  SloPagerDutyMonitor,
} from "../src/slo-pagerduty.js";

describe("TASK-199: Production Runbooks, PagerDuty Integration & SLO Definitions", () => {
  const monitor = new SloPagerDutyMonitor("pd_routing_key_prod_relay");

  it("calculates 99.95% availability error budget consumption and burn rate", () => {
    const totalMonthSeconds = 30 * 24 * 60 * 60; // 2,592,000s
    // Allowed budget = 2,592,000 * 0.0005 = 1,296s (21.6 min)

    // 10 minutes downtime (600s) -> ~46.3% of error budget
    const safeCalc = monitor.calculateErrorBudgetBurn({
      totalSecondsInWindow: totalMonthSeconds,
      downtimeSeconds: 600,
      sloTargetPercent: RELAY_PRODUCTION_SLOS.availability.targetPercent,
    });

    expect(safeCalc.consumedPercent).toBe(46.3);
    expect(safeCalc.remainingPercent).toBe(53.7);
    expect(safeCalc.breached).toBe(false);

    // 25 minutes downtime (1500s) -> breaches 1296s error budget
    const breachCalc = monitor.calculateErrorBudgetBurn({
      totalSecondsInWindow: totalMonthSeconds,
      downtimeSeconds: 1500,
      sloTargetPercent: RELAY_PRODUCTION_SLOS.availability.targetPercent,
    });

    expect(breachCalc.breached).toBe(true);
    expect(breachCalc.consumedPercent).toBeGreaterThan(100);
  });

  it("dispatches PagerDuty critical incident alert when error budget or edge fails", () => {
    const alert = monitor.dispatchIncidentAlert({
      dedupKey: "slo_availability_breach_2026_09",
      summary:
        "CRITICAL: Relay Tunnel Availability SLO Breached (99.95% threshold)",
      severity: "critical",
      customDetails: {
        downtimeSeconds: 1500,
        burnRate: 1.16,
        region: "global",
      },
    });

    expect(alert.dedupKey).toBe("slo_availability_breach_2026_09");
    expect(alert.severity).toBe("critical");
    expect(alert.eventAction).toBe("trigger");
    expect(alert.routingKey).toBe("pd_routing_key_prod_relay");

    const dispatched = monitor.getDispatchedAlerts();
    expect(dispatched.length).toBe(1);
  });
});
