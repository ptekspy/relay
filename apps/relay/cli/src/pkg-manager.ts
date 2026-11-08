import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type PackageManagerName = "bun" | "pnpm" | "npm" | "yarn";

export interface PackageManagerInfo {
  name: PackageManagerName;
  executeCommand: (args: string) => string;
  installCommand: (pkg: string, isDev?: boolean) => string;
}

export function detectPackageManager(
  startDir = process.cwd(),
): PackageManagerInfo {
  let curr = startDir;

  while (curr !== dirname(curr)) {
    if (
      existsSync(resolve(curr, "bun.lockb")) ||
      existsSync(resolve(curr, "bun.lock"))
    ) {
      return {
        name: "bun",
        executeCommand: (args: string) =>
          `bunx @paddy-systems/relay ${args}`.trim(),
        installCommand: (pkg: string, isDev = true) =>
          `bun add ${isDev ? "-d " : ""}${pkg}`,
      };
    }
    if (existsSync(resolve(curr, "pnpm-lock.yaml"))) {
      return {
        name: "pnpm",
        executeCommand: (args: string) =>
          `pnpm dlx @paddy-systems/relay ${args}`.trim(),
        installCommand: (pkg: string, isDev = true) =>
          `pnpm add ${isDev ? "-D " : ""}${pkg}`,
      };
    }
    if (existsSync(resolve(curr, "yarn.lock"))) {
      return {
        name: "yarn",
        executeCommand: (args: string) =>
          `yarn dlx @paddy-systems/relay ${args}`.trim(),
        installCommand: (pkg: string, isDev = true) =>
          `yarn add ${isDev ? "-D " : ""}${pkg}`,
      };
    }
    if (existsSync(resolve(curr, "package-lock.json"))) {
      return {
        name: "npm",
        executeCommand: (args: string) =>
          `npx @paddy-systems/relay ${args}`.trim(),
        installCommand: (pkg: string, isDev = true) =>
          `npm install ${isDev ? "-D " : ""}${pkg}`,
      };
    }
    curr = dirname(curr);
  }

  // Default fallback to bun
  return {
    name: "bun",
    executeCommand: (args: string) =>
      `bunx @paddy-systems/relay ${args}`.trim(),
    installCommand: (pkg: string, isDev = true) =>
      `bun add ${isDev ? "-d " : ""}${pkg}`,
  };
}
