import { IsString, Length, Matches } from "class-validator";

export class MfaCodeDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}

export class MfaVerifyLoginDto {
  @IsString()
  @Length(20, 800)
  mfaToken!: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;
}
