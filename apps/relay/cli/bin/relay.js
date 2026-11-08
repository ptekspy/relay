#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check if running directly in Bun
if (typeof Bun !== "undefined") {
  await import("../src/main.js");
} else {
  // If invoked via Node / npx, delegate to bun if installed or invoke the node entrypoint
  const args = process.argv.slice(2);
  const cliPath = resolve(__dirname, "../src/main.tsx");

  const child = spawn("bun", ["run", cliPath, ...args], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("error", (err) => {
    if (err && err.code === "ENOENT") {
      console.error(
        "\x1b[31m[Relay Error]\x1b[0m Bun runtime is required to run Relay CLI.\nPlease install Bun: curl -fsSL https://bun.sh/install | bash",
      );
      process.exit(1);
    } else {
      console.error("[Relay Error] Failed to launch CLI:", err);
      process.exit(1);
    }
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}
