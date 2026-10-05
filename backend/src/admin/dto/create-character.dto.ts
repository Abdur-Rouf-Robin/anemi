import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCharacterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsIn(["MAIN", "SUPPORTING"])
  role?: "MAIN" | "SUPPORTING";

  @IsOptional()
  @IsString()
  @MaxLength(400)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  actor?: string;
}
