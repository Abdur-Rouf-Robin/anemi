import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ResetDto {
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  token!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "Use at least 10 characters with a letter and a number"
  })
  password!: string;
}
