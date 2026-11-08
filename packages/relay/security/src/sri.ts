export class SriHashGenerator {
  public async generateSri(
    content: string | Uint8Array,
    algorithm: "sha256" | "sha384" | "sha512" = "sha384",
  ): Promise<string> {
    const bytes =
      typeof content === "string" ? new TextEncoder().encode(content) : content;
    const algoMap = {
      sha256: "SHA-256",
      sha384: "SHA-384",
      sha512: "SHA-512",
    };

    if (typeof crypto !== "undefined" && crypto.subtle) {
      const digest = await crypto.subtle.digest(
        algoMap[algorithm],
        bytes as unknown as ArrayBufferView<ArrayBuffer>,
      );
      const base64 = Buffer.from(digest).toString("base64");
      return `${algorithm}-${base64}`;
    }

    // Node / Bun buffer fallback
    const { createHash } = await import("node:crypto");
    const hash = createHash(algorithm).update(bytes).digest("base64");
    return `${algorithm}-${hash}`;
  }
}

export const sriHashGenerator = new SriHashGenerator();
