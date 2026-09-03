import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import type { Request, Response } from "express";

import { AuthService } from "./auth.service";
import type { AuthUser } from "./auth.types";
import { CurrentUser } from "./decorators/current-user.decorator";
import { Public } from "./decorators/public.decorator";
import { SkipCsrf } from "./decorators/skip-csrf.decorator";
import { LoginDto } from "./dto/login.dto";
import { MfaCodeDto, MfaVerifyLoginDto } from "./dto/mfa.dto";
import { PasswordDto } from "./dto/password.dto";
import { ProfileDto } from "./dto/profile.dto";
import { SignupDto } from "./dto/signup.dto";
import { AuthRateLimitGuard } from "./guards/auth-rate-limit.guard";
import { MfaService } from "./mfa.service";
import { clearAuthCookies, setAuthCookies } from "./cookie";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly mfa: MfaService
  ) {}

  @Public()
  @Get("me")
  async me(@CurrentUser() user: AuthUser | null) {
    return { user: user ? await this.auth.publicById(user.id) : null };
  }

  @Patch("me")
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: ProfileDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.auth.updateProfile(user.id, dto.displayName);
    const csrfToken = setAuthCookies(req, res, result.accessToken);
    return { user: result.user, csrfToken };
  }

  @Post("password")
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: PasswordDto) {
    return this.auth.changePassword(user.id, dto.currentPassword, dto.nextPassword);
  }

  @Public()
  @Get("csrf")
  csrf(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentUser() user: AuthUser | null) {
    if (!user) return { csrfToken: null as string | null };
    const token = req.cookies?.anemi_access
      ? setAuthCookies(req, res, String(req.cookies.anemi_access))
      : null;
    return { csrfToken: token };
  }

  @Public()
  @SkipCsrf()
  @UseGuards(AuthRateLimitGuard)
  @Post("signup")
  async signup(
    @Body() dto: SignupDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.auth.signup(dto.email, dto.displayName, dto.password);
    const csrfToken = setAuthCookies(req, res, result.accessToken);
    return { user: result.user, csrfToken };
  }

  @Public()
  @SkipCsrf()
  @UseGuards(AuthRateLimitGuard)
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const user = await this.auth.login(dto.email, dto.password);
    if (user.mfaEnabled) {
      return { mfaRequired: true, mfaToken: this.mfa.issueChallenge(user.id) };
    }
    const result = this.auth.issue(user);
    const csrfToken = setAuthCookies(req, res, result.accessToken);
    return { user: result.user, csrfToken };
  }

  @Public()
  @SkipCsrf()
  @UseGuards(AuthRateLimitGuard)
  @Post("mfa/verify")
  @HttpCode(200)
  async verifyLoginMfa(
    @Body() dto: MfaVerifyLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const userId = this.mfa.readChallenge(dto.mfaToken);
    const ok = await this.mfa.check(userId, dto.code);
    if (!ok) throw new UnauthorizedException("That code is not valid");
    const user = await this.auth.loginById(userId);
    const result = this.auth.issue(user);
    const csrfToken = setAuthCookies(req, res, result.accessToken);
    return { user: result.user, csrfToken };
  }

  @Post("mfa/begin")
  beginMfa(@CurrentUser() user: AuthUser) {
    return this.mfa.begin(user);
  }

  @Post("mfa/confirm")
  confirmMfa(@CurrentUser() user: AuthUser, @Body() dto: MfaCodeDto) {
    return this.mfa.confirm(user.id, dto.code);
  }

  @Post("mfa/disable")
  disableMfa(@CurrentUser() user: AuthUser, @Body() dto: MfaCodeDto) {
    return this.mfa.disable(user.id, dto.code);
  }

  @SkipCsrf()
  @Post("logout")
  @HttpCode(200)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    clearAuthCookies(req, res);
    return { ok: true };
  }
}
