import type { Request } from "express";

export function mediaAccelPrefix() {
  const prefix = process.env.MEDIA_ACCEL_PREFIX?.trim() ?? "";
  if (!prefix) return "";
  return prefix.endsWith("/") ? prefix : `${prefix}/`;
}

export function shouldAccelMedia(req: Request) {
  if (!mediaAccelPrefix()) return false;
  const flag = req.headers["x-anemi-accel"];
  const value = Array.isArray(flag) ? flag[0] : flag;
  return value === "1" || value === "true";
}

export function accelRedirect(relative: string) {
  return `${mediaAccelPrefix()}${relative.replace(/^\/+/, "")}`;
}
