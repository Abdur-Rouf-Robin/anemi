export function episodeReadyToPublish(episode: {
  videoUrl?: string | null;
  encodeStatus?: string | null;
  publish?: string | null;
}) {
  if (episode.publish === "PUBLISHED") return false;
  if (!episode.videoUrl) return false;
  const status = episode.encodeStatus || "idle";
  return status === "ready" || status === "idle";
}
