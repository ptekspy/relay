import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { CommandExecutor, CommandResult } from "./types.js";

const execFileAsync = promisify(execFile);

export const defaultExecutor: CommandExecutor = async (
  file: string,
  args: string[],
  options = {},
): Promise<CommandResult> => {
  try {
    const { stdout, stderr } = await execFileAsync(file, args, {
      timeout: options.timeout ?? 4000,
      encoding: "utf8",
    });
    return {
      stdout: String(stdout),
      stderr: String(stderr),
      exitCode: 0,
    };
  } catch (error: unknown) {
    const err = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
    };
    return {
      stdout: err.stdout ? String(err.stdout) : "",
      stderr: err.stderr ? String(err.stderr) : "",
      exitCode: typeof err.code === "number" ? err.code : 1,
    };
  }
};
