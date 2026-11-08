import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export type ApplicationName =
  | "PADDY_SYSTEMS"
  | "RELAY"
  | "MIRROR"
  | "WEARFOLIO"
  | "STRIDE";

const globalPrefixes = ["GLOBAL_", "NEXT_PUBLIC_GLOBAL_"];

function findWorkspaceRoot(startDirectory: string): string {
  let directory = resolve(startDirectory);

  while (directory !== dirname(directory)) {
    if (existsSync(join(directory, "turbo.json"))) return directory;
    directory = dirname(directory);
  }

  throw new Error("Unable to find the workspace root containing turbo.json.");
}

function parseEnvironmentFile(contents: string): Map<string, string> {
  const values = new Map<string, string>();

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values.set(key, value);
  }

  return values;
}

export function loadApplicationEnvironment(
  applicationName: ApplicationName,
): void {
  const root = findWorkspaceRoot(process.cwd());
  const envFile = join(root, ".env");

  if (!existsSync(envFile)) return;

  const applicationPrefixes = [
    `${applicationName}_`,
    `NEXT_PUBLIC_${applicationName}_`,
  ];
  const values = parseEnvironmentFile(readFileSync(envFile, "utf8"));

  for (const [key, value] of values) {
    if (
      [...globalPrefixes, ...applicationPrefixes].some((prefix) =>
        key.startsWith(prefix),
      ) &&
      process.env[key] === undefined
    ) {
      process.env[key] = value;
    }

    if (key.startsWith("GLOBAL_") || key.startsWith(`${applicationName}_`)) {
      const nextPublicKey = `NEXT_PUBLIC_${key}`;
      if (process.env[nextPublicKey] === undefined) {
        process.env[nextPublicKey] = value;
      }
    }
  }
}
