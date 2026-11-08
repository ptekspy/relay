import type { SourceLocationMapping } from "./types.js";

/**
 * Parses stack trace lines from mobile receivers and maps bundle paths to workspace files.
 */
export class RemoteStackMapper {
  private workspaceRoot: string;

  constructor(workspaceRoot = "/workspace") {
    this.workspaceRoot = workspaceRoot;
  }

  public parseStackLine(line: string): SourceLocationMapping | null {
    // Matches patterns like: at Object.render (http://localhost:3000/src/App.tsx:42:15)
    // or: at /src/components/Header.tsx:12:4
    const match =
      line.match(/(?:at\s+.*?\()?https?:\/\/[^/]+(\/[^:]+):(\d+):(\d+)\)?/) ||
      line.match(/(?:at\s+.*?\()?(\/[^:]+):(\d+):(\d+)\)?/);

    if (!match) return null;

    const rawPath = match[1]!;
    const lineNumber = parseInt(match[2]!, 10);
    const columnNumber = parseInt(match[3]!, 10);

    // Normalize path to workspace file
    const cleanPath = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
    const originalFile = `${this.workspaceRoot}/${cleanPath}`;

    return {
      originalFile,
      lineNumber,
      columnNumber,
    };
  }
}
