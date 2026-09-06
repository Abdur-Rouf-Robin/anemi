import { IsString, MaxLength, MinLength } from "class-validator";

export class CreatePlaylistDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;
}

export class RenamePlaylistDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;
}

export class AddPlaylistItemDto {
  @IsString()
  @MinLength(8)
  @MaxLength(40)
  titleId!: string;
}
