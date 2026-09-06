import { PublishStatus, Role } from "@prisma/client";

import type { AuthUser } from "../auth/auth.types";

export function canReadEpisodeMedia(
  episodePublish: PublishStatus,
  titlePublish: PublishStatus,
  user?: AuthUser | null
) {
  const live = episodePublish === PublishStatus.PUBLISHED && titlePublish === PublishStatus.PUBLISHED;
  if (live) return true;
  return user?.role === Role.ADMIN || user?.role === Role.MODERATOR;
}
