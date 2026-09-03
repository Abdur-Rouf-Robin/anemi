import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from "class-validator";

export class UpsertEpisodeDto {
  @IsOptional()
  @IsString()
  seasonId?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  number?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @Matches(/^(https?:\/\/|\/media\/)/i, { message: "videoUrl must be http(s) or a /media/ file" })
  @MaxLength(500)
  videoUrl?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  durationSec?: number;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  introStartSec?: number;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  introEndSec?: number;

  @IsOptional()
  @IsIn(["SUB", "DUB"])
  audioKind?: "SUB" | "DUB";

  @IsOptional()
  @Transform(({ value }) => (value == null ? undefined : String(value).trim().slice(0, 40)))
  @IsString()
  @MaxLength(40)
  language?: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  @IsString()
  airDate?: string | null;

  @IsOptional()
  @IsIn(["DRAFT", "PUBLISHED", "UNLISTED"])
  publish?: "DRAFT" | "PUBLISHED" | "UNLISTED";

  @IsOptional()
  @Transform(({ value }) => (value === "" || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(0)
  outroStartSec?: number;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? undefined : value))
  @IsString()
  @MaxLength(500)
  subtitleUrl?: string;
}
