import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class PasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "Use at least 10 characters with a letter and a number"
  })
  nextPassword!: string;
}
