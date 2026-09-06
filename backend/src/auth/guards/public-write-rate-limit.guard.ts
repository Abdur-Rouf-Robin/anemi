import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { allowIpHit, requestIp } from "../ip-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX = 8;

@Injectable()
export class PublicWriteRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    allowIpHit(`public-write:${requestIp(req)}`, MAX, WINDOW_MS);
    return true;
  }
}
