import type { CookieOptions, Request, Response } from "express";
import { randomBytes } from "node:crypto";

import { ACCESS_COOKIE, CSRF_COOKIE } from "./auth.constants";

function cookieBase(req: Request): CookieOptions {
  const proto = req.headers["x-forwarded-proto"];
  const secure =
    process.env.NODE_ENV === "production" ||
    req.secure ||
    proto === "https";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

export function setAuthCookies(req: Request, res: Response, accessToken: string): string {
  const csrf = randomBytes(24).toString("hex");
  const base = cookieBase(req);
  res.cookie(ACCESS_COOKIE, accessToken, base);
  res.cookie(CSRF_COOKIE, csrf, { ...base, httpOnly: false });
  return csrf;
}

export function clearAuthCookies(req: Request, res: Response): void {
  const base = cookieBase(req);
  res.clearCookie(ACCESS_COOKIE, { ...base, maxAge: 0 });
  res.clearCookie(CSRF_COOKIE, { ...base, httpOnly: false, maxAge: 0 });
}
