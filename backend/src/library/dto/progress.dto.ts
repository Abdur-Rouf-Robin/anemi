import { Transform } from "class-transformer";
import { IsBoolean, IsInt, IsString, Min } from "class-validator";

export class ProgressDto {
  @IsString()
  episodeId!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  positionSec!: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  durationSec!: number;

  @IsBoolean()
  completed!: boolean;
}
