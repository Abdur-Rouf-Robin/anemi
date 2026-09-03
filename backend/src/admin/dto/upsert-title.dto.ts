import { Transform } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

export class UpsertTitleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  slug!: string;

  @IsIn(["SERIES", "MOVIE", "OVA", "ONA", "SPECIAL"])
  type!: "SERIES" | "MOVIE" | "OVA" | "ONA" | "SPECIAL";

  @IsIn(["UPCOMING", "AIRING", "COMPLETED"])
  status!: "UPCOMING" | "AIRING" | "COMPLETED";

  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  synopsis!: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value == null ? undefined : Number(value)))
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(360)
  hue?: number;

  @IsOptional()
  @IsBoolean()
  spotlight?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  studio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ageRating?: string;

  @IsOptional()
  @IsIn(["WINTER", "SPRING", "SUMMER", "FALL"])
  airSeason?: "WINTER" | "SPRING" | "SUMMER" | "FALL";

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genreSlugs?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(400)
  posterUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  backdropUrl?: string;
}
