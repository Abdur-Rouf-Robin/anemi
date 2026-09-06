import { BadRequestException } from "@nestjs/common";
import { resolve, sep } from "node:path";

export function resolveUnderRoot(root: string, relative = "") {
  const base = resolve(root);
  const clean = relative.replace(/\\/g, "/").replace(/^\/+/, "");
  if (clean.split("/").some((part) => part === "..")) {
    throw new BadRequestException("Path must stay inside the inbox");
  }
  const full = resolve(base, clean);
  if (full !== base && !full.startsWith(base + sep)) {
    throw new BadRequestException("Path must stay inside the inbox");
  }
  return full;
}
