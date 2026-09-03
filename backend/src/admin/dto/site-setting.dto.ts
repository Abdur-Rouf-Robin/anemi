import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";

class HomeConfigDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  spotlightIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featuredIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genreSlugs?: string[];

  @IsOptional()
  @IsString()
  watchNextTitleId?: string | null;

  @IsOptional()
  @IsObject()
  sections?: Record<string, boolean>;
}

export class SiteSettingDto {
  @IsOptional()
  @IsString()
  @MaxLength(280)
  announcement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  announcementHref?: string;

  @IsOptional()
  @IsBoolean()
  scheduleMailEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  communityGuidelines?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => HomeConfigDto)
  homeConfig?: HomeConfigDto;
}
