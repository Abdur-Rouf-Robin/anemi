import { corsOrigins } from "../security/cors-origins";

export function publicSiteUrl() {
  const explicit = (
    process.env.PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    ""
  ).replace(/\/+$/, "");
  if (explicit) return explicit;
  const origins = corsOrigins();
  const https = origins.find((origin) => origin.startsWith("https://"));
  return (https || origins[0] || "http://127.0.0.1:3100").replace(/\/+$/, "");
}
