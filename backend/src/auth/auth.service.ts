import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import { compare, hash } from "bcrypt";

import { mailFrom, mailTransport, smtpConfigured } from "../admin/mailer";
import { publicSiteUrl } from "../lib/public-site-url";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser, JwtPayload } from "./auth.types";
import { hashResetToken, newResetToken } from "./reset-token";
import { sessionVersionMatches } from "./session-version";
import { inviteIsOpen, inviteMatchesEmail, normalizeSignupMode } from "./signup-mode";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async access() {
    const settings = await this.prisma.siteSetting.findUnique({ where: { id: "default" } });
    return {
      signupMode: normalizeSignupMode(settings?.signupMode),
      resetEnabled: smtpConfigured()
    };
  }

  async signup(email: string, displayName: string, password: string, inviteCode?: string) {
    const mode = (await this.access()).signupMode;
    if (mode === "closed") {
      throw new ForbiddenException("New accounts are created by staff. Ask an admin.");
    }
    const normalizedEmail = email.toLowerCase();
    let inviteId: string | null = null;
    if (mode === "invite") {
      const code = inviteCode?.trim();
      if (!code) throw new ForbiddenException("An invite code is required");
      const invite = await this.prisma.invite.findUnique({ where: { code } });
      if (!invite || !inviteIsOpen(invite) || !inviteMatchesEmail(invite.email, normalizedEmail)) {
        throw new ForbiddenException("That invite is not valid");
      }
      inviteId = invite.id;
    }
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existing) throw new ConflictException("An account with that email already exists");
    const user = await this.prisma.$transaction(async (tx) => {
      if (inviteId) {
        const claimed = await tx.invite.updateMany({
          where: { id: inviteId, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
          data: { usedAt: new Date() }
        });
        if (!claimed.count) throw new ForbiddenException("That invite is not valid");
      }
      const created = await tx.user.create({
        data: {
          email: normalizedEmail,
          displayName: displayName.trim(),
          passwordHash: await hash(password, 12),
          role: Role.MEMBER
        }
      });
      if (inviteId) {
        await tx.invite.update({
          where: { id: inviteId },
          data: { usedById: created.id }
        });
      }
      return created;
    });
    return this.issue(user);
  }

  async requestReset(email: string) {
    if (!smtpConfigured()) {
      throw new BadRequestException("Password reset is not available. Ask a site admin.");
    }
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (!user) return { ok: true };
    await this.prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }
    });
    const token = newResetToken();
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000)
      }
    });
    const transport = mailTransport();
    if (!transport) throw new BadRequestException("Password reset is not available. Ask a site admin.");
    const href = `${publicSiteUrl()}/account/reset?token=${token}`;
    await transport.sendMail({
      from: mailFrom(),
      to: user.email,
      subject: "Reset your Anemi password",
      text: `Reset your password (link expires in 1 hour):\n${href}\n\nIf you did not ask for this, ignore the email.`
    });
    return { ok: true };
  }

  async resetPassword(token: string, password: string) {
    const row = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: hashResetToken(token) },
      include: { user: true }
    });
    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException("That reset link is invalid or expired");
    }
    const next = await this.prisma.$transaction(async (tx) => {
      await tx.passwordReset.update({
        where: { id: row.id },
        data: { usedAt: new Date() }
      });
      return tx.user.update({
        where: { id: row.userId },
        data: {
          passwordHash: await hash(password, 12),
          tokenVersion: { increment: 1 }
        }
      });
    });
    return this.issue(next);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Email or password is wrong");
    }
    return user;
  }

  async loginById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async publicById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return this.toPublic(user);
  }

  toPublic(user: { id: string; email: string; displayName: string; role: Role; mfaEnabled?: boolean }) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      mfaEnabled: Boolean(user.mfaEnabled)
    };
  }

  async updateProfile(id: string, displayName: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { displayName: displayName.trim() }
    });
    return this.issue(user);
  }

  async changePassword(id: string, currentPassword: string, nextPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !(await compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException("Current password is wrong");
    }
    const next = await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hash(nextPassword, 12),
        tokenVersion: { increment: 1 }
      }
    });
    return this.issue(next);
  }

  issue(user: {
    id: string;
    email: string;
    displayName: string;
    role: Role;
    mfaEnabled?: boolean;
    tokenVersion?: number;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      ver: user.tokenVersion ?? 0
    };
    const accessToken = this.jwt.sign(payload, { expiresIn: "7d" });
    return { accessToken, user: this.toPublic(user) };
  }

  async userFromToken(token: string): Promise<AuthUser | null> {
    try {
      const payload = this.jwt.verify<JwtPayload>(token);
      const row = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, displayName: true, role: true, tokenVersion: true }
      });
      if (!row || !sessionVersionMatches(payload.ver, row.tokenVersion)) return null;
      return {
        id: row.id,
        email: row.email,
        displayName: row.displayName,
        role: row.role
      };
    } catch {
      return null;
    }
  }
}
