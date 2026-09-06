import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

const SORTS = ["popular", "newest", "az", "relevance", "score", "updated"] as const;
const TYPES = ["SERIES", "MOVIE", "OVA", "ONA", "SPECIAL", "ANIMATION"] as const;
const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;

export class QueryTitlesDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @IsIn(TYPES)
  type?: (typeof TYPES)[number];

  @IsOptional()
  @IsIn(["UPCOMING", "AIRING", "COMPLETED"])
  status?: "UPCOMING" | "AIRING" | "COMPLETED";

  @IsOptional()
  @IsString()
  @MaxLength(40)
  genre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  studio?: string;

  @IsOptional()
  @IsIn(SORTS)
  sort?: (typeof SORTS)[number];

  @IsOptional()
  @IsIn(["SUB", "DUB"])
  audio?: "SUB" | "DUB";

  @IsOptional()
  @IsIn(SEASONS)
  season?: (typeof SEASONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(1)
  letter?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(80)
  take?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(5000)
  skip?: number;
}
