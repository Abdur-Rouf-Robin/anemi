import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import { compare, hash } from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser, JwtPayload } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async signup(email: string, displayName: string, password: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (existing) throw new ConflictException("An account with that email already exists");
    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        displayName: displayName.trim(),
        passwordHash: await hash(password, 12),
        role: Role.MEMBER
      }
    });
    return this.issue(user);
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
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await hash(nextPassword, 12) }
    });
    return { ok: true };
  }

  issue(user: { id: string; email: string; displayName: string; role: Role; mfaEnabled?: boolean }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role
    };
    const accessToken = this.jwt.sign(payload, { expiresIn: "7d" });
    return { accessToken, user: this.toPublic(user) };
  }
}
