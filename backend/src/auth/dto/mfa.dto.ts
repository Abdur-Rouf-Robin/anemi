import { IsOptional, IsString, Length, Matches } from "class-validator";

export class MfaCodeDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;

  @IsOptional()
  @IsString()
  @Length(20, 800)
  setupToken?: string;
}

export class MfaVerifyLoginDto {
  @IsString()
  @Length(20, 800)
  mfaToken!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
