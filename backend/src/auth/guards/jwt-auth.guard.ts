import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import { ACCESS_COOKIE } from "../auth.constants";
import { AuthService } from "../auth.service";
import type { AuthUser } from "../auth.types";
import { IS_PUBLIC } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass()
    ]);
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = req.cookies?.[ACCESS_COOKIE];
    const user = typeof token === "string" && token.trim() ? await this.auth.userFromToken(token) : null;
    if (user) req.user = user;
    if (isPublic) return true;
    if (!user) throw new UnauthorizedException();
    return true;
  }
}
