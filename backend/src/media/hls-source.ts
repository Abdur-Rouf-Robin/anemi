export function shouldCopyToHls(videoCodec: string, audioCodec?: string | null) {
  const video = videoCodec.trim().toLowerCase();
  const audio = (audioCodec ?? "").trim().toLowerCase();
  return (video === "h264" || video === "avc1") && (!audio || audio === "aac" || audio === "mp4a.40.2");
}
