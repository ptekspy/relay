import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseCliArgs } from "../src/args.js";
import { CiRunner } from "../src/ci-runner.js";

describe("TASK-181: Relay Headless CLI Runner for CI/CD Pipelines (relay ci)", () => {
  it("parses relay ci subcommand and arguments correctly", () => {
    const config = parseCliArgs([
      "ci",
      "8080",
      "--command",
      "npm test",
      "--output-file",
      ".relay-ci.json",
    ]);

    expect(config.isCi).toBe(true);
    expect(config.port).toBe(8080);
    expect(config.ciCommand).toBe("npm test");
    expect(config.ciOutputFile).toBe(".relay-ci.json");
  });

  it("generates deterministic machine-readable endpoint metadata", () => {
    const runner = new CiRunner({
      port: 3000,
      tunnelUrl: "https://ci-test.relay.paddy.systems",
    });

    const meta = runner.generateMetadata("ci_static_id");
    expect(meta.sessionId).toBe("ci_static_id");
    expect(meta.targetPort).toBe(3000);
    expect(meta.tunnelUrl).toBe("https://ci-test.relay.paddy.systems");
    expect(meta.lanUrl).toBe("http://127.0.0.1:7331");
  });

  it("writes endpoint output file to disk when configured", () => {
    const testOutFile = join(tmpdir(), `relay-ci-test-${Date.now()}.json`);
    const runner = new CiRunner({
      port: 4000,
      outputFile: testOutFile,
    });

    const meta = runner.generateMetadata("sess_tmp_123");
    runner.exportEndpoints(meta);

    expect(existsSync(testOutFile)).toBe(true);
    const content = JSON.parse(readFileSync(testOutFile, "utf8"));
    expect(content.sessionId).toBe("sess_tmp_123");
    expect(content.targetPort).toBe(4000);

    unlinkSync(testOutFile);
  });

  it("propagates sub-process execution exit codes correctly", async () => {
    const runnerSuccess = new CiRunner({
      port: 3000,
      command: 'node -e "process.exit(0)"',
    });
    const codeSuccess = await runnerSuccess.run();
    expect(codeSuccess).toBe(0);

    const runnerFail = new CiRunner({
      port: 3000,
      command: "exit 42",
    });
    const codeFail = await runnerFail.run();
    expect(codeFail).toBe(42);
  });
});
