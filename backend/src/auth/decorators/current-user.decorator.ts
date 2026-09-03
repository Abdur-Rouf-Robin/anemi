import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { AuthUser } from "../auth.types";

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
  return req.user ?? null;
});
