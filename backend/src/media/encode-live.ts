export type EncodeMode = "copy" | "transcode" | "original";

export type EncodeSnapshot = {
  currentId: string | null;
  percent: number;
  mode: EncodeMode | null;
  queue: string[];
  busy: boolean;
};

export type EncodeJobProgress = {
  percent: number | null;
  mode: EncodeMode | null;
  position: number | null;
};

export function encodeJobProgress(episodeId: string, status: string, live: EncodeSnapshot): EncodeJobProgress {
  if (live.currentId === episodeId) {
    return { percent: live.percent, mode: live.mode, position: 0 };
  }
  const index = live.queue.indexOf(episodeId);
  if (index >= 0) {
    return { percent: 0, mode: null, position: index + 1 };
  }
  if (status === "queued") {
    return { percent: 0, mode: null, position: null };
  }
  if (status === "ready") {
    return { percent: 100, mode: null, position: null };
  }
  return { percent: null, mode: null, position: null };
}
