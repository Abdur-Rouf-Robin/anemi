import { cookies } from "next/headers";

import { demoHome, episodeById, filterTitles, titleBySlug } from "./demo-catalog";
import { defaultPrefs } from "./prefs";
import type {
  EpisodeCard,
  HomePayload,
  LibraryPayload,
  Playlist,
  Preferences,
  TitleCard,
  TitleDetail,
  WatchPayload
} from "./types";
import { mapCatalogEpisode, type CatalogEpisodeResponse } from "./watch-map";

function allowDemoFallback() {
  return process.env.NODE_ENV !== "production";
}

function emptyHome(): HomePayload {
  return {
    spotlight: null,
    spotlights: [],
    trending: [],
    movies: [],
    series: [],
    animation: [],
    airing: [],
    upcoming: [],
    completed: [],
    added: [],
    latest: [],
    charts: { day: [], week: [], month: [] },
    featuredGenres: [],
    homeSections: {},
    watchNextTitle: null,
    collections: []
  };
}

function apiUrl(path: string) {
  const base = (
    process.env.BACKEND_INTERNAL_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://127.0.0.1:4100"
  ).replace(/\/+$/, "");
  return `${base}${path}`;
}

async function fetchJson<T>(path: string, authed = false, revalidate = 30): Promise<T | null> {
  try {
    const headers: HeadersInit = {};
    if (authed) {
      const jar = await cookies();
      headers.cookie = jar.toString();
    }
    const fresh = authed || revalidate === 0;
    const res = await fetch(apiUrl(path), {
      cache: fresh ? "no-store" : undefined,
      next: fresh ? undefined : { revalidate },
      headers
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getLibrary(): Promise<LibraryPayload | null> {
  return fetchJson<LibraryPayload>("/library", true);
}

export async function getMe() {
  return fetchJson<{ user: { id: string; displayName: string; email: string; role: string; createdAt?: string } | null }>(
    "/auth/me",
    true,
    0
  );
}

export async function getPlaylists(): Promise<Playlist[] | null> {
  return fetchJson<Playlist[]>("/playlists", true);
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  return fetchJson<Playlist>(`/playlists/${id}`, true, 0);
}

export async function getProgress(episodeId: string) {
  return fetchJson<{ positionSec: number; durationSec: number; completed: boolean } | null>(
    `/library/progress/${episodeId}`,
    true
  );
}

export async function getSessionUser() {
  return fetchJson<{
    user: { id: string; displayName: string; role: string; mfaEnabled?: boolean } | null;
  }>("/auth/me", true);
}

export async function getHome(): Promise<HomePayload> {
  const live = await fetchJson<HomePayload>("/catalog/home", false, 5);
  if (live) return live;
  return allowDemoFallback() ? demoHome() : emptyHome();
}

export async function getHomeState(): Promise<{ home: HomePayload; live: boolean }> {
  const live = await fetchJson<HomePayload>("/catalog/home", false, 5);
  if (live) return { home: live, live: true };
  return { home: allowDemoFallback() ? demoHome() : emptyHome(), live: false };
}

export async function getDiscover() {
  return fetchJson<{
    season: string;
    seasonal: TitleCard[];
    scored: TitleCard[];
    updated: TitleCard[];
  }>("/catalog/discover");
}

export async function getGenres() {
  return (await fetchJson<{ slug: string; name: string }[]>("/catalog/genres")) ?? [];
}

export async function getAnnouncement() {
  return fetchJson<{
    announcement: string | null;
    announcementHref: string | null;
    communityGuidelines: string | null;
  }>("/catalog/announcement", true);
}

export async function getCharts() {
  return fetchJson<{ day: TitleCard[]; week: TitleCard[]; month: TitleCard[] }>("/catalog/charts");
}

export async function getRelated(slug: string): Promise<TitleCard[]> {
  const data = await fetchJson<{ items: TitleCard[] }>(`/catalog/titles/${slug}/related`);
  return data?.items ?? [];
}

export async function getCollection(slug: string) {
  return fetchJson<{ name: string; slug: string; items: TitleCard[] }>(`/catalog/collections/${slug}`);
}

export async function getTitles(search: {
  q?: string;
  type?: string;
  status?: string;
  genre?: string;
  sort?: string;
  year?: string;
  season?: string;
  audio?: string;
  letter?: string;
  studio?: string;
  take?: string;
  skip?: string;
}): Promise<{ items: TitleCard[]; total: number }> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  const data = await fetchJson<{ items: TitleCard[]; total?: number }>(`/catalog/titles${qs ? `?${qs}` : ""}`);
  if (data?.items) return { items: data.items, total: data.total ?? data.items.length };
  const fallback = allowDemoFallback() ? filterTitles(search) : [];
  const take = Number(search.take ?? 24);
  const skip = Number(search.skip ?? 0);
  return { items: fallback.slice(skip, skip + (Number.isFinite(take) ? take : 24)), total: fallback.length };
}

export async function getTitle(slug: string): Promise<TitleDetail | null> {
  return (await fetchJson<TitleDetail>(`/catalog/titles/${slug}`, false, 0)) ?? (allowDemoFallback() ? titleBySlug(slug) : null);
}

export async function getRandomTitle() {
  return fetchJson<TitleCard>("/catalog/random");
}

export async function getLatest(audio?: string, take = 24) {
  const params = new URLSearchParams();
  if (audio) params.set("audio", audio);
  if (take !== 24) params.set("take", String(take));
  const qs = params.toString();
  return fetchJson<{ items: EpisodeCard[] }>(`/catalog/latest${qs ? `?${qs}` : ""}`);
}

export async function getSchedule() {
  return fetchJson<{ days: { date: string; items: EpisodeCard[] }[] }>("/catalog/schedule");
}

export async function getCommunityPosts(category?: string, take?: number) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (take) params.set("take", String(take));
  const qs = params.toString();
  return (
    (await fetchJson<
      { id: string; category: string; title: string; body: string; createdAt: string; displayName: string }[]
    >(`/community/posts${qs ? `?${qs}` : ""}`)) ?? []
  );
}

export async function getStudios() {
  return (
    (await fetchJson<{ name: string; slug: string; count: number }[]>("/catalog/studios")) ?? []
  );
}

export async function getStudio(slug: string) {
  return fetchJson<{ name: string; slug: string; items: TitleCard[] }>(`/catalog/studios/${slug}`);
}

export async function getPreferences(): Promise<Preferences> {
  return (
    (await fetchJson<Preferences>("/preferences/me", true)) ?? defaultPrefs
  );
}

export async function getEpisode(id: string): Promise<WatchPayload | null> {
  const live = await fetchJson<CatalogEpisodeResponse>(`/catalog/episodes/${id}`, false, 0);
  if (live) return mapCatalogEpisode(live);
  const demo = allowDemoFallback() ? episodeById(id) : null;
  if (!demo) return null;
  return {
    episode: demo.episode,
    title: {
      slug: demo.title.slug,
      name: demo.title.name,
      hue: demo.title.hue,
      type: demo.title.type
    },
    episodes: demo.season.episodes,
    seasonNumber: demo.season.number
  };
}
