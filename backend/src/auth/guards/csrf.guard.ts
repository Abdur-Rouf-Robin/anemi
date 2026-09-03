import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";

import { CSRF_COOKIE, CSRF_HEADER } from "../auth.constants";
import { SKIP_CSRF } from "../decorators/skip-csrf.decorator";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF, [
      context.getHandler(),
      context.getClass()
    ]);
    const req = context.switchToHttp().getRequest<Request>();
    if (skip || SAFE.has(req.method.toUpperCase())) return true;
    const cookie = typeof req.cookies?.[CSRF_COOKIE] === "string" ? req.cookies[CSRF_COOKIE] : "";
    const headerRaw = req.headers[CSRF_HEADER];
    const header = typeof headerRaw === "string" ? headerRaw : "";
    if (!cookie || !header || !tokensMatch(cookie, header)) {
      throw new ForbiddenException("CSRF token missing or invalid");
    }
    return true;
  }
}

function tokensMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
