import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { generateSecret, generateURI, verify } from "otplib";

import { decryptField, encryptField } from "../lib/field-encryption";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "./auth.types";

@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  issueChallenge(userId: string) {
    return this.jwt.sign({ sub: userId, purpose: "mfa" }, { expiresIn: "5m" });
  }

  readChallenge(token: string): string {
    try {
      const payload = this.jwt.verify<{ sub: string; purpose?: string }>(token);
      if (payload.purpose !== "mfa" || !payload.sub) throw new Error("bad");
      return payload.sub;
    } catch {
      throw new UnauthorizedException("MFA session expired. Sign in again.");
    }
  }

  async begin(user: AuthUser) {
    const secret = generateSecret();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: encryptField(secret), mfaEnabled: false }
    });
    return {
      secret,
      otpauthUrl: generateURI({ issuer: "Anemi", label: user.email, secret })
    };
  }

  async confirm(userId: string, code: string) {
    const row = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!row?.totpSecret) throw new BadRequestException("Start MFA setup first");
    const result = await verify({ token: code, secret: decryptField(row.totpSecret) });
    if (!result.valid) throw new BadRequestException("That code is not valid");
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true }
    });
    return { enabled: true };
  }

  async disable(userId: string, code: string) {
    const row = await this.prisma.user.findUnique({ where: { id: userId } });
    if (row?.role === Role.ADMIN || row?.role === Role.MODERATOR) {
      throw new BadRequestException("Staff accounts cannot turn off MFA");
    }
    const ok = await this.check(userId, code);
    if (!ok) throw new BadRequestException("That code is not valid");
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: null, mfaEnabled: false }
    });
    return { enabled: false };
  }

  async check(userId: string, code: string): Promise<boolean> {
    const row = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!row?.totpSecret || !row.mfaEnabled) return false;
    const result = await verify({ token: code, secret: decryptField(row.totpSecret) });
    return result.valid;
  }
}
