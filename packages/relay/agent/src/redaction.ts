const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Bearer tokens & JWTs
  { pattern: /bearer\s+[a-zA-Z0-9_\-.]+/gi, replacement: "Bearer [REDACTED]" },
  {
    pattern: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+/g,
    replacement: "[REDACTED_JWT]",
  },
  // Common key/token parameters
  {
    pattern:
      /"(token|password|secret|apiKey|api_key|authorization)":\s*"[^"]+"/gi,
    replacement: '"$1": "[REDACTED]"',
  },
  // Credit cards
  { pattern: /\b(?:\d{4}[ -]?){3}\d{4}\b/g, replacement: "[REDACTED_CARD]" },
  // Email addresses
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g,
    replacement: "[REDACTED_EMAIL]",
  },
];

export function redactSensitiveText(input: string): string {
  let result = input;
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function safeSerialize(
  value: unknown,
  seen = new WeakSet<object>(),
): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return redactSensitiveText(value);
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "function")
    return `[Function: ${value.name || "anonymous"}]`;

  if (value instanceof Error) {
    return redactSensitiveText(
      `${value.name}: ${value.message}\n${value.stack ?? ""}`,
    );
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);

    try {
      if (Array.isArray(value)) {
        return `[${value.map((item) => (typeof item === "string" ? `"${safeSerialize(item, seen)}"` : safeSerialize(item, seen))).join(", ")}]`;
      }

      // Check if DOM Element
      if (typeof Element !== "undefined" && value instanceof Element) {
        const id = value.id ? `#${value.id}` : "";
        const classes = value.className
          ? `.${String(value.className).split(" ").join(".")}`
          : "";
        return `<${value.tagName.toLowerCase()}${id}${classes}>`;
      }

      const entries = Object.entries(value).map(([k, v]) => {
        const serializedValue =
          typeof v === "string"
            ? `"${safeSerialize(v, seen)}"`
            : safeSerialize(v, seen);
        return `"${k}": ${serializedValue}`;
      });
      const serialized = `{${entries.join(", ")}}`;
      return redactSensitiveText(serialized);
    } catch {
      return "[Unserializable Object]";
    }
  }

  return redactSensitiveText(String(value));
}
