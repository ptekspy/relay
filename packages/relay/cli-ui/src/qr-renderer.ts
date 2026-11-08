/**
 * Renders compact ANSI half-block (▀ / ▄ / █ / ' ') QR representations for the terminal.
 */
export class TerminalQrRenderer {
  public renderMatrix(matrix: boolean[][], invert = false): string {
    const lines: string[] = [];
    const height = matrix.length;
    const width = height > 0 ? matrix[0]?.length || 0 : 0;

    // Process 2 vertical rows per printed line using unicode half-block characters
    for (let r = 0; r < height; r += 2) {
      let line = "";
      for (let c = 0; c < width; c++) {
        const top = matrix[r]?.[c] ?? false;
        const bottom = matrix[r + 1]?.[c] ?? false;

        const effectiveTop = invert ? !top : top;
        const effectiveBottom = invert ? !bottom : bottom;

        if (effectiveTop && effectiveBottom) {
          line += "█";
        } else if (effectiveTop && !effectiveBottom) {
          line += "▀";
        } else if (!effectiveTop && effectiveBottom) {
          line += "▄";
        } else {
          line += " ";
        }
      }
      lines.push(line);
    }

    return lines.join("\n");
  }

  public generateMockQr(size = 14): boolean[][] {
    const matrix: boolean[][] = [];
    for (let i = 0; i < size; i++) {
      const row: boolean[] = [];
      for (let j = 0; j < size; j++) {
        // Deterministic pseudo-QR finder patterns
        const isFinderTopLeft = i < 4 && j < 4;
        const isFinderTopRight = i < 4 && j >= size - 4;
        const isFinderBottomLeft = i >= size - 4 && j < 4;
        const isPattern = (i + j) % 3 === 0;
        row.push(
          isFinderTopLeft ||
            isFinderTopRight ||
            isFinderBottomLeft ||
            isPattern,
        );
      }
      matrix.push(row);
    }
    return matrix;
  }
}

export const terminalQrRenderer = new TerminalQrRenderer();
