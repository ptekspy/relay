import crypto from "node:crypto";

export class TunnelEncryption {
  private key: Buffer;

  constructor(sessionSecret: string, salt = "paddy-systems-relay-v1") {
    // Derive 256-bit encryption key
    this.key = crypto.pbkdf2Sync(sessionSecret, salt, 10000, 32, "sha256");
  }

  public encrypt(data: Uint8Array): Uint8Array {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(data)),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // Packed format: [IV 12B][Tag 16B][Ciphertext NB]
    return new Uint8Array(Buffer.concat([iv, tag, encrypted]));
  }

  public decrypt(packed: Uint8Array): Uint8Array {
    if (packed.byteLength < 28) {
      throw new Error("Ciphertext too short: corrupted payload");
    }

    const buf = Buffer.from(packed);
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);

    const decipher = crypto.createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);

    return new Uint8Array(
      Buffer.concat([decipher.update(ciphertext), decipher.final()]),
    );
  }
}
