import { describe, expect, it } from "bun:test";
import {
  DisasterRecoveryManager,
  EdgeHealthService,
  EdgeWafFilter,
  OpenTelemetryBridge,
  PrometheusMetricsRegistry,
  StripeBillingWebhookHandler,
  StructuredLogger,
  UsageMeter,
} from "../src/index.js";

describe("Multi-Tenancy, Observability & Production Release Gates (Epic 10)", () => {
  it("processes Stripe subscription webhooks and updates entitlements (TASK-091)", () => {
    const handler = new StripeBillingWebhookHandler();
    const priceMap = {
      price_solo_monthly: { tier: "solo" as const },
      price_teams_monthly: { tier: "teams" as const, minSeats: 3 },
    };

    // Active subscription event
    const activeSub = handler.processWebhook(
      {
        id: "evt_1",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_abc",
            status: "active",
            items: {
              data: [
                {
                  price: { id: "price_solo_monthly", product: "prod_solo" },
                  quantity: 1,
                },
              ],
            },
          },
        },
      },
      priceMap,
    );

    expect(activeSub.tier).toBe("solo");
    expect(activeSub.status).toBe("active");

    // Canceled subscription event demotes to free
    const canceledSub = handler.processWebhook(
      {
        id: "evt_2",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_123",
            customer: "cus_abc",
            status: "canceled",
          },
        },
      },
      priceMap,
    );

    expect(canceledSub.tier).toBe("free");
  });

  it("meters bandwidth & recording storage and generates quota warnings (TASK-092)", () => {
    const meter = new UsageMeter();

    // 20GB of 50GB on Solo -> OK
    const repOk = meter.evaluateUsage("solo", 20 * 1024 * 1024 * 1024, 2);
    expect(repOk.status).toBe("OK");
    expect(repOk.upgradeRecommended).toBe(false);

    // 42GB of 50GB on Solo -> 84% -> WARNING_80
    const repWarn = meter.evaluateUsage("solo", 42 * 1024 * 1024 * 1024, 5);
    expect(repWarn.status).toBe("WARNING_80");
    expect(repWarn.upgradeRecommended).toBe(true);

    // 55GB of 50GB on Solo -> 110% -> EXCEEDED_100
    const repExceeded = meter.evaluateUsage("solo", 55 * 1024 * 1024 * 1024, 8);
    expect(repExceeded.status).toBe("EXCEEDED_100");
  });

  it("propagates W3C traceparent headers for OpenTelemetry distributed tracing (TASK-093)", () => {
    const bridge = new OpenTelemetryBridge();
    const ctx = bridge.generateTraceContext();
    const header = bridge.formatTraceParent(ctx);

    expect(header.startsWith("00-")).toBe(true);
    expect(header.endsWith("-01")).toBe(true);

    const parsed = bridge.parseTraceParent(header);
    expect(parsed.traceId).toBe(ctx.traceId);
    expect(parsed.spanId).toBe(ctx.spanId);
    expect(parsed.sampled).toBe(true);
  });

  it("exports Prometheus metrics format for cluster observability (TASK-094)", () => {
    const registry = new PrometheusMetricsRegistry();
    registry.recordSessionStarted();
    registry.recordReceiverConnected();
    registry.recordBytesTransferred(1024 * 1024);
    registry.recordRttLatency(0.015);

    const metricsStr = registry.exportMetrics();
    expect(metricsStr).toContain("relay_active_sessions 1");
    expect(metricsStr).toContain("relay_connected_receivers 1");
    expect(metricsStr).toContain("relay_tunnel_bytes_total 1048576");
    expect(metricsStr).toContain("relay_rtt_seconds 0.015");
  });

  it("redacts sensitive authentication tokens and secrets in structured JSON logs (TASK-095)", () => {
    const logger = new StructuredLogger("corr_test_99");
    const entry = logger.log("info", "User attempted login", {
      username: "paddy",
      password: "SuperSecretPassword!",
      bearerToken: "Bearer abc123xyz",
      cookieHeader: "session_id=foo123",
    });

    expect(entry.correlationId).toBe("corr_test_99");
    expect(entry.context?.username).toBe("paddy");
    expect(entry.context?.password).toBe("[REDACTED]");
    expect(entry.context?.bearerToken).toBe("[REDACTED]");
    expect(entry.context?.cookieHeader).toBe("[REDACTED]");
  });

  it("responds to edge health check probes and reports readiness (TASK-096)", () => {
    const health = new EdgeHealthService();
    expect(health.checkLiveness()).toBe(true);

    const readyBefore = health.checkReadiness();
    expect(readyBefore.status).toBe("UP");
    expect(readyBefore.checks.database).toBe("PASS");

    // Simulate database outage
    health.setDbStatus(false);
    const readyAfter = health.checkReadiness();
    expect(readyAfter.status).toBe("DOWN");
    expect(readyAfter.checks.database).toBe("FAIL");
  });

  it("mitigates path traversal, injection, and abusive burst rates at edge WAF (TASK-097)", () => {
    const waf = new EdgeWafFilter(5, 5000); // 5 max burst requests per 5s window

    // Path traversal attempt blocked
    const traversal = waf.inspectRequest("1.2.3.4", "/static/../../etc/passwd");
    expect(traversal.allowed).toBe(false);
    expect(traversal.blockCategory).toBe("PATH_TRAVERSAL");

    // SQL injection attempt blocked
    const sqli = waf.inspectRequest(
      "1.2.3.4",
      "/api/v1/sessions?filter=UNION%20SELECT",
    );
    expect(sqli.allowed).toBe(false);
    expect(sqli.blockCategory).toBe("SQL_INJECTION");

    // Normal requests allowed
    for (let i = 0; i < 5; i++) {
      expect(waf.inspectRequest("5.6.7.8", "/api/v1/sessions").allowed).toBe(
        true,
      );
    }

    // 6th request within window blocked for burst rate
    const burst = waf.inspectRequest("5.6.7.8", "/api/v1/sessions");
    expect(burst.allowed).toBe(false);
    expect(burst.blockCategory).toBe("RATE_LIMIT_BURST");
  });

  it("creates encrypted backup manifests and verifies point-in-time recovery hashes (TASK-098)", () => {
    const dr = new DisasterRecoveryManager();
    const mockDump = Buffer.from(
      "DUMP_CONTENT_TABLE_SESSIONS_RECEIVERS_AUDIT_LOGS",
    );

    const { manifest, payload } = dr.createBackupManifest(
      "relay_production",
      mockDump,
      "00000001000000000000002F",
    );
    expect(manifest.database).toBe("relay_production");
    expect(manifest.encrypted).toBe(true);
    expect(manifest.sizeBytes).toBe(mockDump.length);

    // Verify valid backup
    const isValid = dr.verifyBackupIntegrity(manifest, payload);
    expect(isValid).toBe(true);

    // Corrupted backup rejected
    const corruptedPayload = Buffer.from("TAMPERED_CONTENT");
    const isCorruptedValid = dr.verifyBackupIntegrity(
      manifest,
      corruptedPayload,
    );
    expect(isCorruptedValid).toBe(false);
  });
});
