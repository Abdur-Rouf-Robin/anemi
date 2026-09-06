import { Type } from "class-transformer";
import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateInviteDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}
