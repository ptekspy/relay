import { z } from "zod";

export const SecurityAuditEventTypeSchema = z.enum([
  "AUTH_SUCCESS",
  "AUTH_FAILURE",
  "SHORT_CODE_BRUTE_FORCE_ATTEMPT",
  "TOKEN_REVOKED",
  "POLICY_VIOLATION",
  "RATE_LIMIT_EXCEEDED",
  "SSRF_TARGET_BLOCKED",
]);

export type SecurityAuditEventType = z.infer<
  typeof SecurityAuditEventTypeSchema
>;

export const SecurityAuditEventSchema = z.object({
  id: z.string().uuid(),
  type: SecurityAuditEventTypeSchema,
  timestamp: z.string().datetime(),
  actor: z.object({
    userId: z.string().optional(),
    teamId: z.string().optional(),
    ipAddress: z.string(),
    userAgent: z.string().optional(),
  }),
  target: z.object({
    sessionId: z.string().optional(),
    resource: z.string().optional(),
  }),
  details: z.record(z.string(), z.unknown()),
  severity: z.enum(["info", "warning", "critical"]),
});

export type SecurityAuditEvent = z.infer<typeof SecurityAuditEventSchema>;
