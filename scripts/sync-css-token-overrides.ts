import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

type ColorToken = {
  name: string;
  value: string;
};

const ignoredDirectoryNames: ReadonlySet<string> = new Set([
  ".git",
  ".next",
  ".turbo",
  "node_modules",
]);

const colorTokenPattern: RegExp = /^\s*(--color-[\w-]+):\s*([^;]+);/gm;

function parseColorTokens(source: string): ReadonlyArray<ColorToken> {
  return Array.from(source.matchAll(colorTokenPattern), (match): ColorToken => {
    const name: string | undefined = match[1];
    const value: string | undefined = match[2];

    if (name === undefined || value === undefined) {
      throw new Error(
        "Unable to parse a colour token from the shared contract.",
      );
    }

    return { name, value };
  });
}

function findNextApplicationDirectories(
  directory: string,
): ReadonlyArray<string> {
  const applicationDirectories: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectoryNames.has(entry.name)) {
        applicationDirectories.push(
          ...findNextApplicationDirectories(join(directory, entry.name)),
        );
      }

      continue;
    }

    if (/^next\.config\.[cm]?[jt]s$/.test(entry.name)) {
      applicationDirectories.push(directory);
    }
  }

  return applicationDirectories;
}

function findThemeInlineClosingBrace(source: string): number | undefined {
  const themeStartIndex: number = source.indexOf("@theme inline {");

  if (themeStartIndex === -1) {
    return undefined;
  }

  const openingBraceIndex: number = source.indexOf("{", themeStartIndex);
  let depth: number = 0;

  for (
    let index: number = openingBraceIndex;
    index < source.length;
    index += 1
  ) {
    const character: string = source[index] ?? "";

    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;
    if (depth === 0) return index;
  }

  throw new Error("Unable to find the end of the app's @theme inline block.");
}

function syncColorTokens(
  source: string,
  contract: ReadonlyArray<ColorToken>,
): string {
  const closingBraceIndex: number | undefined =
    findThemeInlineClosingBrace(source);

  if (closingBraceIndex === undefined) {
    const declarations: string = contract
      .map((token: ColorToken): string => `  ${token.name}: ${token.value};`)
      .join("\n");

    return `${source.trimEnd()}\n\n@theme inline {\n${declarations}\n}\n`;
  }

  const themeBlock: string = source.slice(0, closingBraceIndex);
  const existingTokenNames: ReadonlySet<string> = new Set(
    parseColorTokens(themeBlock).map((token: ColorToken): string => token.name),
  );
  const missingTokens: ReadonlyArray<ColorToken> = contract.filter(
    (token: ColorToken): boolean => !existingTokenNames.has(token.name),
  );

  if (missingTokens.length === 0) {
    return source;
  }

  const declarations: string = missingTokens
    .map((token: ColorToken): string => `  ${token.name}: ${token.value};`)
    .join("\n");

  return `${themeBlock}\n${declarations}\n${source.slice(closingBraceIndex)}`;
}

function stageFiles(filePaths: ReadonlyArray<string>): void {
  if (filePaths.length === 0) {
    return;
  }

  const result = spawnSync("git", ["add", "--", ...filePaths], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error("Unable to stage synced CSS token overrides.");
  }
}

function main(): void {
  const workspaceRoot: string = resolve(process.cwd());
  const contractPath: string = join(
    workspaceRoot,
    "packages/shared/primitives/theme.css",
  );
  const contract: ReadonlyArray<ColorToken> = parseColorTokens(
    readFileSync(contractPath, "utf8"),
  );
  const changedFiles: string[] = [];

  for (const applicationDirectory of findNextApplicationDirectories(
    workspaceRoot,
  )) {
    const globalsPath: string = join(applicationDirectory, "app/globals.css");

    if (!existsSync(globalsPath)) {
      continue;
    }

    const source: string = readFileSync(globalsPath, "utf8");
    const syncedSource: string = syncColorTokens(source, contract);

    if (syncedSource !== source) {
      writeFileSync(globalsPath, syncedSource);
      changedFiles.push(globalsPath);
    }
  }

  if (process.argv.includes("--stage")) {
    stageFiles(changedFiles);
  }

  const output: string =
    changedFiles.length === 0
      ? "CSS token overrides are up to date."
      : `Added missing CSS token overrides to ${changedFiles
          .map((filePath: string): string =>
            filePath.replace(`${workspaceRoot}/`, ""),
          )
          .join(", ")}.`;

  process.stdout.write(`${output}\n`);
}

main();
