const CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]?){3}(?:\d{4})\b/g;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const PAT_REGEX = /pst_live_[a-zA-Z0-9]{20,}/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

export class SensitiveDataRedactor {
  public redactText(text: string): string {
    return text
      .replace(CREDIT_CARD_REGEX, "[REDACTED_CARD]")
      .replace(BEARER_REGEX, "Bearer [REDACTED_TOKEN]")
      .replace(PAT_REGEX, "[REDACTED_PAT]")
      .replace(EMAIL_REGEX, "[REDACTED_EMAIL]");
  }

  public redactHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const redacted: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      const lower = key.toLowerCase();
      if (
        lower === "authorization" ||
        lower === "cookie" ||
        lower === "set-cookie" ||
        lower.includes("secret") ||
        lower.includes("key")
      ) {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = this.redactText(value);
      }
    }
    return redacted;
  }

  public redactDomHtml(html: string): string {
    // Redact password inputs: value="..." in password input
    return html
      .replace(
        /(type=["']password["'][^>]*?value=["'])([^"']*)(["'])/gi,
        "$1[REDACTED_PASSWORD]$3",
      )
      .replace(
        /(name=["'](?:password|passwd|pwd|secret|token)["'][^>]*?value=["'])([^"']*)(["'])/gi,
        "$1[REDACTED_PASSWORD]$3",
      );
  }
}
