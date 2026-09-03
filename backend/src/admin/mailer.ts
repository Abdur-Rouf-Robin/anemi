import { createTransport } from "nodemailer";

export function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim() || process.env.SMTP_URL?.trim());
}

export function mailTransport() {
  const url = process.env.SMTP_URL?.trim();
  if (url) return createTransport(url);
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  return createTransport({
    host,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
  });
}

export function mailFrom() {
  return process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || "anemi@localhost";
}
