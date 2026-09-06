export function encodeReadyData(videoUrl: string, encodeError: string | null = null) {
  return {
    encodeStatus: "ready" as const,
    encodeError,
    videoUrl
  };
}
