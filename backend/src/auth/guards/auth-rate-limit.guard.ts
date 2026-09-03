import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { Request } from "express";

const WINDOW_MS = 15 * 60 * 1000;
const MAX = 20;
const hits = new Map<string, { count: number; resetAt: number }>();

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const current = hits.get(ip);
    if (!current || current.resetAt < now) {
      hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }
    current.count += 1;
    if (current.count > MAX) {
      throw new HttpException("Too many auth attempts. Try later.", HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
