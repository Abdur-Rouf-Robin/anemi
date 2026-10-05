import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

function optionalSeconds({ value }: { value: unknown }) {
  if (value === "" || value == null) return undefined;
  return Number(value);
}

export class SkipSuggestionDto {
  @IsOptional()
  @Transform(optionalSeconds)
  @IsInt()
  @Min(0)
  @Max(60 * 60 * 6)
  introStartSec?: number;

  @IsOptional()
  @Transform(optionalSeconds)
  @IsInt()
  @Min(0)
  @Max(60 * 60 * 6)
  introEndSec?: number;

  @IsOptional()
  @Transform(optionalSeconds)
  @IsInt()
  @Min(0)
  @Max(60 * 60 * 6)
  outroStartSec?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
