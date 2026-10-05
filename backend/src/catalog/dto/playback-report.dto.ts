import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

const KINDS = ["video", "audio", "subtitle", "skip"] as const;

export class PlaybackReportDto {
  @IsIn(KINDS)
  kind!: (typeof KINDS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
