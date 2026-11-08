import type { AnsiColorDepth } from "./types.js";

export class AnsiColorDegrader {
  public detectColorDepth(env = process.env): AnsiColorDepth {
    if (env.NO_COLOR || env.TERM === "dumb") {
      return "monochrome";
    }
    if (env.COLORTERM === "truecolor" || env.COLORTERM === "24bit") {
      return "truecolor";
    }
    if (env.TERM?.includes("256color")) {
      return "256color";
    }
    return "16color";
  }

  public colorize(
    text: string,
    hexColor: string,
    depth: AnsiColorDepth,
  ): string {
    if (depth === "monochrome") {
      return text;
    }

    const r = parseInt(hexColor.slice(1, 3), 16) || 0;
    const g = parseInt(hexColor.slice(3, 5), 16) || 0;
    const b = parseInt(hexColor.slice(5, 7), 16) || 0;

    if (depth === "truecolor") {
      return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
    }

    if (depth === "256color") {
      // 6x6x6 color cube approximation
      const code =
        16 +
        36 * Math.round((r / 255) * 5) +
        6 * Math.round((g / 255) * 5) +
        Math.round((b / 255) * 5);
      return `\x1b[38;5;${code}m${text}\x1b[0m`;
    }

    // 16 color basic fallback
    return `\x1b[34m${text}\x1b[0m`;
  }
}

export const ansiColorDegrader = new AnsiColorDegrader();
