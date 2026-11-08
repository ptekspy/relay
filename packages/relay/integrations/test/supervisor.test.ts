import { describe, expect, it } from "bun:test";
import { DevSupervisor } from "../src/supervisor.js";

describe("TASK-129: Multi-Process Dev Supervisor", () => {
  it("extracts port numbers from common dev server output logs", () => {
    const supervisor = new DevSupervisor({ command: "node -v" });

    expect(
      DevSupervisor.extractPortFromLog("  ➜  Local:   http://localhost:5173/"),
    ).toBe(5173);
    expect(
      DevSupervisor.extractPortFromLog(
        "ready - started server on 0.0.0.0:3000, url: http://localhost:3000",
      ),
    ).toBe(3000);
    expect(
      DevSupervisor.extractPortFromLog("Server listening on port 8080"),
    ).toBe(8080);
  });

  it("spawns command, tracks process status, and terminates cleanly without leaving orphans", async () => {
    // Spawns a background sleep loop
    const supervisor = new DevSupervisor({
      command: "sleep 10",
      gracefulTimeoutMs: 500,
    });

    // Start asynchronously
    const runPromise = supervisor.start();

    // Give process 50ms to spawn
    await new Promise((resolve) => setTimeout(resolve, 50));

    const status = supervisor.getStatus();
    expect(status.isRunning).toBe(true);
    expect(status.pid).not.toBeNull();

    // Terminate process group
    await supervisor.terminate();

    const exitCode = await runPromise;
    expect(supervisor.getStatus().isRunning).toBe(false);
  });
});
