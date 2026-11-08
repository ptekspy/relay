import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { $ } from "bun";

export interface BuildTarget {
  name: string;
  target:
    | "bun-linux-x64"
    | "bun-linux-arm64"
    | "bun-darwin-x64"
    | "bun-darwin-arm64"
    | "bun-windows-x64";
  outfile: string;
}

export const TARGETS: BuildTarget[] = [
  {
    name: "linux-x64",
    target: "bun-linux-x64",
    outfile: "dist/binaries/relay-linux-x64",
  },
  {
    name: "linux-arm64",
    target: "bun-linux-arm64",
    outfile: "dist/binaries/relay-linux-arm64",
  },
  {
    name: "darwin-x64",
    target: "bun-darwin-x64",
    outfile: "dist/binaries/relay-darwin-x64",
  },
  {
    name: "darwin-arm64",
    target: "bun-darwin-arm64",
    outfile: "dist/binaries/relay-darwin-arm64",
  },
  {
    name: "windows-x64",
    target: "bun-windows-x64",
    outfile: "dist/binaries/relay-windows-x64.exe",
  },
];

export async function buildCliBinary(
  target: BuildTarget,
  rootDir = process.cwd(),
): Promise<string> {
  const entrypoint = resolve(rootDir, "apps/relay/cli/src/main.tsx");
  const fullOutfile = resolve(rootDir, target.outfile);
  const outDir = resolve(fullOutfile, "..");

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  console.log(`[build-cli] Compiling ${target.name} (${target.target})...`);
  await $`bun build --compile --target=${target.target} --minify ${entrypoint} --outfile ${fullOutfile}`;
  console.log(`[build-cli] Compiled binary generated: ${fullOutfile}`);

  return fullOutfile;
}

async function main() {
  const selectedTargetArg = process.argv[2];
  const targets = selectedTargetArg
    ? TARGETS.filter((t) => t.name === selectedTargetArg)
    : TARGETS.slice(0, 1); // Default to current host linux-x64

  for (const t of targets) {
    await buildCliBinary(t);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("[build-cli] Build failed:", err);
    process.exit(1);
  });
}
