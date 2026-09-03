import { IsIn } from "class-validator";

export class SetRoleDto {
  @IsIn(["VIEWER", "MEMBER", "MODERATOR", "ADMIN"])
  role!: "VIEWER" | "MEMBER" | "MODERATOR" | "ADMIN";
}
