import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateArtworkDto {
  @IsString()
  @MinLength(1)
  @MaxLength(400)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  caption?: string;
}
