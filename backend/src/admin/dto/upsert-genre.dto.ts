import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class UpsertGenreDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MaxLength(40)
  slug?: string;
}
