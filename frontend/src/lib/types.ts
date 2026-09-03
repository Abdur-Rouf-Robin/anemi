export type Genre = { slug: string; name: string };

export type TitleType = "SERIES" | "MOVIE" | "OVA" | "ONA" | "SPECIAL";
export type TitleStatus = "UPCOMING" | "AIRING" | "COMPLETED";
export type ListStatus = "WATCHING" | "PLAN_TO_WATCH" | "ON_HOLD" | "DROPPED" | "COMPLETED";

export type TitleCard = {
  id: string;
  slug: string;
  type: TitleType;
  status: TitleStatus;
  name: string;
  synopsis: string;
  year: number | null;
  hue: number;
  viewCount: number;
  spotlight?: boolean;
  studio?: string | null;
  ageRating?: string | null;
  airSeason?: "WINTER" | "SPRING" | "SUMMER" | "FALL" | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  score?: number | null;
  nextAirDate?: string | null;
  subCount?: number;
  dubCount?: number;
  episodeCount?: number;
  windowViews?: number;
  genres: Genre[];
  seasons?: { number: number; episodes?: { id: string }[] }[];
  continueEpisodeId?: string;
  progress?: number;
};

export type EpisodeCard = {
  episodeId: string;
  number: number;
  name: string;
  audioKind: "SUB" | "DUB";
  airDate?: string | null;
  durationSec?: number | null;
  seasonNumber: number;
  title: TitleCard;
};

export type WatchEpisode = {
  id: string;
  number: number;
  name: string;
  durationSec?: number | null;
  introStartSec?: number | null;
  introEndSec?: number | null;
  outroStartSec?: number | null;
  subtitleUrl?: string | null;
  videoUrl?: string | null;
  audioKind?: "SUB" | "DUB";
  language?: string | null;
  airDate?: string | null;
  captions?: { language: string; url: string }[];
};

export type WatchPayload = {
  episode: WatchEpisode;
  title: {
    id?: string;
    slug: string;
    name: string;
    hue: number;
    type: string;
    studio?: string | null;
    ageRating?: string | null;
    score?: number | null;
    posterUrl?: string | null;
    backdropUrl?: string | null;
    synopsis?: string | null;
    year?: number | null;
    genres?: Genre[];
  };
  episodes: WatchEpisode[];
  seasonNumber: number;
};

export type ContinueTitle = TitleCard & {
  continueEpisodeId?: string;
  progress?: number;
};

export type LibraryPayload = {
  later: TitleCard[];
  following: TitleCard[];
  continueWatching: ContinueTitle[];
  lists: Record<ListStatus, TitleCard[]>;
  history: {
    episodeId: string;
    episodeName: string;
    episodeNumber: number;
    watchedAt: string;
    title: TitleCard;
  }[];
};

export type Episode = {
  id: string;
  number: number;
  slug?: string;
  name: string;
  synopsis?: string | null;
  durationSec?: number | null;
  audioKind?: "SUB" | "DUB";
  language?: string | null;
  airDate?: string | null;
  introStartSec?: number | null;
  introEndSec?: number | null;
  videoUrl?: string | null;
};

export type TitleDetail = Omit<TitleCard, "seasons"> & {
  seasons: { number: number; name?: string | null; episodes: Episode[] }[];
};

export type HomePayload = {
  spotlight: TitleCard | null;
  spotlights?: TitleCard[];
  trending: TitleCard[];
  movies: TitleCard[];
  series?: TitleCard[];
  animation?: TitleCard[];
  airing: TitleCard[];
  upcoming: TitleCard[];
  completed?: TitleCard[];
  added?: TitleCard[];
  latest: TitleCard[];
  charts?: {
    day: TitleCard[];
    week: TitleCard[];
    month: TitleCard[];
  };
  featuredGenres?: { slug: string; name: string }[];
  homeSections?: Record<string, boolean>;
  watchNextTitle?: TitleCard | null;
};

export type Preferences = {
  autoPlay: boolean;
  autoNext: boolean;
  autoSkipIntro: boolean;
  theme: "dark" | "light";
  locale: "en" | "jp";
};
