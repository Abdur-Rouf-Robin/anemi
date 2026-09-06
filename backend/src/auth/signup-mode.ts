export type SignupMode = "open" | "invite" | "closed";

export function normalizeSignupMode(value?: string | null): SignupMode {
  if (value === "open" || value === "closed") return value;
  return "invite";
}

export function inviteIsOpen(invite: {
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  email?: string | null;
}) {
  if (invite.usedAt || invite.revokedAt) return false;
  return invite.expiresAt.getTime() > Date.now();
}

export function inviteMatchesEmail(inviteEmail: string | null | undefined, signupEmail: string) {
  if (!inviteEmail?.trim()) return true;
  return inviteEmail.trim().toLowerCase() === signupEmail.trim().toLowerCase();
}
