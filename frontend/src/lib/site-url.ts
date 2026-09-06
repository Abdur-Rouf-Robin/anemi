export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const api = process.env.NEXT_PUBLIC_API_URL?.trim() || "";
  if (api.includes("127.0.0.1") || api.includes("localhost")) return "http://127.0.0.1:3100";
  if (/^https?:\/\//.test(api)) return api.replace(/\/+$/, "");
  return "http://127.0.0.1:3100";
}

export function absoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
