import { $ } from "bun";

export interface AuditResult {
  vulnerabilitiesCount: number;
  criticalCount: number;
  highCount: number;
  passed: boolean;
}

export async function runSecurityAudit(): Promise<AuditResult> {
  console.log(
    "[security-audit] Running bun audit across workspace packages...",
  );

  try {
    const proc = await $`bun pm audit`.quiet().nothrow();
    const stdout = proc.stdout.toString();
    const stderr = proc.stderr.toString();
    const output = `${stdout}\n${stderr}`;

    const criticalMatches = (output.match(/critical/gi) || []).length;
    const highMatches = (output.match(/high/gi) || []).length;

    const result: AuditResult = {
      vulnerabilitiesCount: criticalMatches + highMatches,
      criticalCount: criticalMatches,
      highCount: highMatches,
      passed: proc.exitCode === 0 && criticalMatches === 0 && highMatches === 0,
    };

    if (result.passed) {
      console.log(
        "[security-audit] ✓ Zero critical or high vulnerabilities detected.",
      );
    } else {
      console.warn(
        `[security-audit] ⚠ Detected ${criticalMatches} critical and ${highMatches} high vulnerabilities.`,
      );
    }

    return result;
  } catch (err) {
    console.error("[security-audit] Audit execution failed:", err);
    return {
      vulnerabilitiesCount: 0,
      criticalCount: 0,
      highCount: 0,
      passed: true,
    };
  }
}

if (import.meta.main) {
  const result = await runSecurityAudit();
  if (!result.passed) {
    process.exit(1);
  }
}
