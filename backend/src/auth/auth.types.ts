import type { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
};

export type JwtPayload = {
  sub: string;
  email: string;
  displayName: string;
  role: Role;
};
