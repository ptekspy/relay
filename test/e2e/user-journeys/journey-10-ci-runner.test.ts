import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseCliArgs } from "../../../apps/relay/cli/src/args.js";
import { CiRunner } from "../../../apps/relay/cli/src/ci-runner.js";

describe("Journey 10: Headless CI/CD Automated Test Pipeline (relay ci)", () => {
  it("parses CLI arguments, generates endpoint files, injects environment, and propagates exit codes", async () => {
    // 1. Argument parsing verification for `relay ci`
    const args = [
      "ci",
      "5000",
      "--command",
      "echo 'testing'",
      "--output-file",
      "/tmp/relay-ci-test.json",
    ];
    const parsed = parseCliArgs(args);

    expect(parsed.isCi).toBe(true);
    expect(parsed.port).toBe(5000);
    expect(parsed.ciCommand).toBe("echo 'testing'");
    expect(parsed.ciOutputFile).toBe("/tmp/relay-ci-test.json");

    // 2. Machine-readable metadata and endpoint file writing
    const outputFile = join(tmpdir(), `relay-e2e-ci-${Date.now()}.json`);
    const runner = new CiRunner({
      port: 5000,
      outputFile,
      tunnelUrl: "https://ci-test.relay.paddy.systems",
      gatewayPort: 7331,
    });

    const meta = runner.generateMetadata("ci_pipeline_run_99");
    expect(meta.sessionId).toBe("ci_pipeline_run_99");
    expect(meta.targetPort).toBe(5000);
    expect(meta.gatewayPort).toBe(7331);
    expect(meta.tunnelUrl).toBe("https://ci-test.relay.paddy.systems");
    expect(meta.lanUrl).toBe("http://127.0.0.1:7331");

    runner.exportEndpoints(meta);

    expect(existsSync(outputFile)).toBe(true);
    const fileData = JSON.parse(readFileSync(outputFile, "utf8"));
    expect(fileData.sessionId).toBe("ci_pipeline_run_99");
    expect(fileData.targetPort).toBe(5000);
    expect(fileData.tunnelUrl).toBe("https://ci-test.relay.paddy.systems");

    unlinkSync(outputFile);

    // 3. Child execution: verifying environment variable propagation and zero exit code
    const zeroRunner = new CiRunner({
      port: 5000,
      command:
        'node -e "process.exit(process.env.RELAY_SESSION_ID && process.env.RELAY_GATEWAY_URL ? 0 : 1)"',
    });
    const zeroExit = await zeroRunner.run();
    expect(zeroExit).toBe(0);

    // 4. Child execution: verifying failure exit code propagation
    const failRunner = new CiRunner({
      port: 5000,
      command: "exit 42",
    });
    const failExit = await failRunner.run();
    expect(failExit).toBe(42);
  });
});
