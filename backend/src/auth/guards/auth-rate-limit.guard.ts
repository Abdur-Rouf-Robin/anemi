import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { allowIpHit, requestIp } from "../ip-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const MAX = 20;

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    allowIpHit(`auth:${requestIp(req)}`, MAX, WINDOW_MS);
    return true;
  }
}
