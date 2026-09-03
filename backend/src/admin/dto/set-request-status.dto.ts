import { IsIn } from "class-validator";

export class SetRequestStatusDto {
  @IsIn(["OPEN", "REVIEWING", "FULFILLED", "DECLINED"])
  status!: "OPEN" | "REVIEWING" | "FULFILLED" | "DECLINED";
}
