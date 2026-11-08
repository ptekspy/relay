import crypto from "node:crypto";

export interface Ed25519KeyPair {
  publicKeyPem: string;
  privateKeyPem: string;
}

export function generateEd25519KeyPair(): Ed25519KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  return {
    publicKeyPem: publicKey,
    privateKeyPem: privateKey,
  };
}

export function signPayloadEd25519(
  payload: string,
  privateKeyPem: string,
): string {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const signature = crypto.sign(null, Buffer.from(payload, "utf8"), privateKey);
  return signature.toString("base64url");
}

export function verifySignatureEd25519(
  payload: string,
  signatureBase64Url: string,
  publicKeyPem: string,
): boolean {
  try {
    const publicKey = crypto.createPublicKey(publicKeyPem);
    const signature = Buffer.from(signatureBase64Url, "base64url");
    return crypto.verify(
      null,
      Buffer.from(payload, "utf8"),
      publicKey,
      signature,
    );
  } catch {
    return false;
  }
}
