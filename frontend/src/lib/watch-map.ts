import type { WatchPayload } from "@/lib/types";

export type CatalogEpisodeResponse = {
  id: string;
  number: number;
  name: string;
  durationSec: number | null;
  introStartSec: number | null;
  introEndSec: number | null;
  outroStartSec?: number | null;
  subtitleUrl?: string | null;
  videoUrl: string | null;
  audioKind?: "SUB" | "DUB";
  language?: string | null;
  kind?: string | null;
  captions?: { language: string; url: string }[];
  season: {
    number: number;
    title: WatchPayload["title"] & { id?: string };
    episodes: {
      id: string;
      number: string | number;
      name: string;
      durationSec: number | null;
      audioKind?: "SUB" | "DUB";
      language?: string | null;
      kind?: string | null;
      subtitleUrl?: string | null;
      videoUrl?: string | null;
      captions?: { language: string; url: string }[];
    }[];
  };
};

export function mapCatalogEpisode(live: CatalogEpisodeResponse): WatchPayload {
  return {
    episode: {
      id: live.id,
      number: live.number,
      name: live.name,
      durationSec: live.durationSec,
      introStartSec: live.introStartSec,
      introEndSec: live.introEndSec,
      outroStartSec: live.outroStartSec,
      subtitleUrl: live.subtitleUrl,
      videoUrl: live.videoUrl,
      audioKind: live.audioKind,
      language: live.language,
      captions: live.captions
    },
    title: live.season.title,
    episodes: live.season.episodes.map((item) => ({
      ...item,
      number: Number(item.number)
    })),
    seasonNumber: live.season.number
  };
}

export function watchIdFromPath(path = "") {
  const match = path.match(/\/watch\/([^/?#]+)/);
  return match?.[1] ?? "";
}
