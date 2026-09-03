import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { AuthUser } from "../auth.types";

@Injectable()
export class StaffMfaGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user) return true;
    if (user.role !== Role.ADMIN && user.role !== Role.MODERATOR) return true;
    const row = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { mfaEnabled: true }
    });
    if (!row?.mfaEnabled) {
      throw new ForbiddenException("Turn on MFA at /account before using the CMS");
    }
    return true;
  }
}
