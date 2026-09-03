import { IsString, MaxLength, MinLength } from "class-validator";

export class SendNewsletterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  subject!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(8000)
  body!: string;
}
