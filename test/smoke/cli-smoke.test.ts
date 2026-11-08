import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateShellCompletion } from "../../apps/relay/cli/src/completion.js";
import { CredentialStorage } from "../../apps/relay/cli/src/credentials.js";
import { JsonEventLogger } from "../../apps/relay/cli/src/json-mode.js";
import { detectPackageManager } from "../../apps/relay/cli/src/pkg-manager.js";
import { TerminalLayoutManager } from "../../apps/relay/cli/src/terminal.js";
import { isNewerVersion } from "../../apps/relay/cli/src/update-check.js";

describe("CLI DX: Shell Completions (TASK-P23)", () => {
  it("generates bash completion script containing flags", () => {
    const script = generateShellCompletion("bash");
    expect(script).toContain("_relay_completions");
    expect(script).toContain("--gateway-port");
    expect(script).toContain("--no-browser");
  });

  it("generates zsh completion script containing descriptions", () => {
    const script = generateShellCompletion("zsh");
    expect(script).toContain("#compdef relay");
    expect(script).toContain("--large-qr");
  });

  it("generates fish completion script", () => {
    const script = generateShellCompletion("fish");
    expect(script).toContain("complete -c relay");
  });
});

describe("CLI DX: Version Update Checker (TASK-P26)", () => {
  it("correctly identifies newer semantic versions", () => {
    expect(isNewerVersion("0.0.1", "0.0.2")).toBe(true);
    expect(isNewerVersion("1.0.0", "1.1.0")).toBe(true);
    expect(isNewerVersion("1.5.2", "2.0.0")).toBe(true);
    expect(isNewerVersion("1.5.2", "1.5.2")).toBe(false);
    expect(isNewerVersion("2.0.0", "1.9.9")).toBe(false);
  });
});

describe("CLI DX: Package Manager Detection (TASK-P29)", () => {
  it("detects package manager in monorepo root", () => {
    const pm = detectPackageManager(process.cwd());
    expect(["bun", "pnpm", "npm", "yarn"]).toContain(pm.name);
    expect(pm.executeCommand("3000")).toContain("relay 3000");
  });
});

describe("CLI DX: Credential Storage (TASK-P28)", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "relay-creds-test-"));
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("saves and reloads credentials securely", () => {
    const storage = new CredentialStorage(tempDir);
    storage.save({ apiKey: "test-api-key-123", teamId: "team_abc" });

    const loaded = storage.load();
    expect(loaded.apiKey).toBe("test-api-key-123");
    expect(loaded.teamId).toBe("team_abc");
    expect(loaded.updatedAt).toBeDefined();

    storage.clear();
    const cleared = storage.load();
    expect(cleared.apiKey).toBeUndefined();
  });
});

describe("CLI DX: JSON Event Mode & Terminal Layout (TASK-P24, TASK-P25)", () => {
  it("formats json event logger without throwing", () => {
    const logger = new JsonEventLogger(false);
    expect(logger.isJsonMode()).toBe(false);

    const activeLogger = new JsonEventLogger(true);
    expect(activeLogger.isJsonMode()).toBe(true);
  });

  it("calculates terminal dimensions cleanly", () => {
    const manager = new TerminalLayoutManager();
    const dims = manager.getDimensions();
    expect(dims.columns).toBeGreaterThan(0);
    expect(dims.rows).toBeGreaterThan(0);
    manager.destroy();
  });
});
