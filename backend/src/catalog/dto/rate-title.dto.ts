import { Transform } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class RateTitleDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(10)
  score!: number;
}
