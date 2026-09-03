import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @MinLength(8)
  episodeId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  body!: string;

  @IsOptional()
  @IsBoolean()
  spoiler?: boolean;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class ReportCommentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  reason!: string;
}
