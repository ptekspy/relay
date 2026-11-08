export class MarkdownDocLinter {
  public validateDocument(markdown: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check broken markdown links []()
    const linkRegex = /\[([^\]]+)\]\(([^)]*)\)/g;
    let match: RegExpExecArray | null = null;

    // biome-ignore lint/suspicious/noAssignInExpressions: regex exec iteration
    while ((match = linkRegex.exec(markdown)) !== null) {
      const url = match[2];
      if (!url || url.trim().length === 0) {
        errors.push(`Empty link destination for text: "${match[1]}"`);
      }
    }

    // Check unclosed code fences
    const fenceMatches = markdown.match(/```/g);
    if (fenceMatches && fenceMatches.length % 2 !== 0) {
      errors.push("Unclosed code fence detected in markdown content");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const markdownDocLinter = new MarkdownDocLinter();
