import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  Matches,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested
} from "class-validator";

export const LIST_STATUSES = [
  "WATCHING",
  "PLAN_TO_WATCH",
  "ON_HOLD",
  "DROPPED",
  "COMPLETED"
] as const;

export class ListStatusDto {
  @IsIn(LIST_STATUSES)
  status!: (typeof LIST_STATUSES)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  score?: number;
}

class ImportEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsIn(LIST_STATUSES)
  status!: (typeof LIST_STATUSES)[number];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  score?: number;
}

export class ImportListDto {
  @IsArray()
  @ArrayMaxSize(2000)
  @ValidateNested({ each: true })
  @Type(() => ImportEntryDto)
  entries!: ImportEntryDto[];
}

export class ImportAniListDto {
  @IsString()
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9_\-. ]+$/, { message: "Use a public AniList username" })
  username!: string;
}
