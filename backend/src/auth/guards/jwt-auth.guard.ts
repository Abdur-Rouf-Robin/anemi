import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

import { ACCESS_COOKIE } from "../auth.constants";
import type { AuthUser, JwtPayload } from "../auth.types";
import { IS_PUBLIC } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass()
    ]);
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = this.readUser(req);
    if (user) req.user = user;
    if (isPublic) return true;
    if (!user) throw new UnauthorizedException();
    return true;
  }

  private readUser(req: Request): AuthUser | null {
    const token = req.cookies?.[ACCESS_COOKIE];
    if (typeof token !== "string" || !token.trim()) return null;
    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      return {
        id: payload.sub,
        email: payload.email,
        displayName: payload.displayName,
        role: payload.role
      };
    } catch {
      return null;
    }
  }
}
