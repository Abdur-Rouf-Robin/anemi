import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  displayName!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "Use at least 10 characters with a letter and a number"
  })
  password!: string;

  @IsOptional()
  @IsIn(["VIEWER", "MEMBER", "MODERATOR", "ADMIN"])
  role?: "VIEWER" | "MEMBER" | "MODERATOR" | "ADMIN";
}
