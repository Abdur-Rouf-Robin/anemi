import { IsOptional, IsString, MaxLength } from "class-validator";

export class ImportInboxDto {
  @IsString()
  @MaxLength(200)
  path!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  seasonId?: string;
}
