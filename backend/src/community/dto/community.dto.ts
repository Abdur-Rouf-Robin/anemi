import { IsBoolean, IsEmail, IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  referenceUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}

export class CreatePostDto {
  @IsIn(["updates", "general", "suggestion", "question"])
  category!: "updates" | "general" | "suggestion" | "question";

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  body!: string;
}

export class NewsletterDto {
  @IsEmail()
  email!: string;
}

export class ContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  body!: string;
}

export class PreferencesDto {
  @IsOptional()
  @IsBoolean()
  autoPlay?: boolean;

  @IsOptional()
  @IsBoolean()
  autoNext?: boolean;

  @IsOptional()
  @IsBoolean()
  autoSkipIntro?: boolean;

  @IsOptional()
  @IsIn(["dark", "light"])
  theme?: "dark" | "light";

  @IsOptional()
  @IsIn(["en", "jp"])
  locale?: "en" | "jp";

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
