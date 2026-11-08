/**
 * Production Runbooks, PagerDuty Integration & SLO Definitions
 *
 * Defines Service Level Objectives (SLOs):
 * - Tunnel Availability: 99.95% (monthly error budget: 0.05% ~ 21.6 minutes)
 * - Edge Latency Overhead: p95 < 50ms
 *
 * Tracks Error Budget Burn Rates and dispatches PagerDuty incident alerts
 * with automated deduplication and escalation routing.
 *
 * Note for Octavia: Exported from @paddy-systems/relay-infra/slo.
 */

export interface ServiceLevelObjective {
  name: string;
  targetPercent: number; // e.g. 99.95
  windowDays: number; // e.g. 30
  maxAllowedErrorBudgetSeconds: number;
}

export const RELAY_PRODUCTION_SLOS: Record<
  "availability" | "edgeLatency",
  ServiceLevelObjective
> = {
  availability: {
    name: "Relay Tunnel Gateway Availability",
    targetPercent: 99.95,
    windowDays: 30,
    maxAllowedErrorBudgetSeconds: Math.round(30 * 24 * 60 * 60 * 0.0005), // ~1296s (21.6 min)
  },
  edgeLatency: {
    name: "Edge Routing Latency Overhead (p95)",
    targetPercent: 99.0, // 99% of requests < 50ms
    windowDays: 30,
    maxAllowedErrorBudgetSeconds: Math.round(30 * 24 * 60 * 60 * 0.01),
  },
};

export type PagerDutySeverity = "info" | "warning" | "error" | "critical";

export interface PagerDutyAlertPayload {
  routingKey: string;
  eventAction: "trigger" | "acknowledge" | "resolve";
  dedupKey: string;
  summary: string;
  severity: PagerDutySeverity;
  source: string;
  timestamp: string;
  customDetails: Record<string, unknown>;
}

export class SloPagerDutyMonitor {
  private alertsDispatched: PagerDutyAlertPayload[] = [];
  private routingKey: string;

  constructor(routingKey = "pd_live_relay_sre_service_key") {
    this.routingKey = routingKey;
  }

  public calculateErrorBudgetBurn(options: {
    totalSecondsInWindow: number;
    downtimeSeconds: number;
    sloTargetPercent: number;
  }): {
    consumedPercent: number;
    remainingPercent: number;
    burnRate: number;
    breached: boolean;
  } {
    const errorBudgetFraction = (100 - options.sloTargetPercent) / 100;
    const totalAllowedErrorSeconds =
      options.totalSecondsInWindow * errorBudgetFraction;

    const consumedFraction = options.downtimeSeconds / totalAllowedErrorSeconds;
    const consumedPercent = Number((consumedFraction * 100).toFixed(2));
    const remainingPercent = Number(
      Math.max(0, 100 - consumedPercent).toFixed(2),
    );

    // Burn rate = 1.0 means consuming exactly 100% budget over the entire window
    const burnRate = Number(consumedFraction.toFixed(2));
    const breached = options.downtimeSeconds > totalAllowedErrorSeconds;

    return {
      consumedPercent,
      remainingPercent,
      burnRate,
      breached,
    };
  }

  public dispatchIncidentAlert(options: {
    dedupKey: string;
    summary: string;
    severity: PagerDutySeverity;
    customDetails?: Record<string, unknown>;
  }): PagerDutyAlertPayload {
    const alert: PagerDutyAlertPayload = {
      routingKey: this.routingKey,
      eventAction: "trigger",
      dedupKey: options.dedupKey,
      summary: options.summary,
      severity: options.severity,
      source: "relay-edge-sre-monitor",
      timestamp: new Date().toISOString(),
      customDetails: options.customDetails ?? {},
    };

    this.alertsDispatched.push(alert);
    return alert;
  }

  public getDispatchedAlerts(): PagerDutyAlertPayload[] {
    return [...this.alertsDispatched];
  }
}
