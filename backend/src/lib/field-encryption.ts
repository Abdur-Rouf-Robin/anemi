import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export function fieldEncryptionKeySource() {
  return process.env.MFA_SECRET?.trim() || process.env.JWT_SECRET || "anemi-dev";
}

function key() {
  return createHash("sha256").update(fieldEncryptionKeySource()).digest();
}

export function encryptField(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptField(value: string): string {
  if (!value.startsWith("enc:")) return value;
  const [, ivHex, tagHex, dataHex] = value.split(":");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]).toString(
    "utf8"
  );
}
