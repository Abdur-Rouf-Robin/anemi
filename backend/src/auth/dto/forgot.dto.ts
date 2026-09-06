import { IsEmail, MaxLength } from "class-validator";

export class ForgotDto {
  @IsEmail()
  @MaxLength(120)
  email!: string;
}
