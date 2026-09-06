import { createHash, randomBytes } from "node:crypto";

export function newResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newInviteCode() {
  return randomBytes(18).toString("base64url");
}
