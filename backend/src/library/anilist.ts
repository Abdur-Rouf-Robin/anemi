import { ListStatus } from "@prisma/client";

export type MappedEntry = {
  name: string;
  status: ListStatus;
  score?: number;
};

const STATUS: Record<string, ListStatus> = {
  CURRENT: ListStatus.WATCHING,
  REPEATING: ListStatus.WATCHING,
  PLANNING: ListStatus.PLAN_TO_WATCH,
  PAUSED: ListStatus.ON_HOLD,
  DROPPED: ListStatus.DROPPED,
  COMPLETED: ListStatus.COMPLETED,
  WATCHING: ListStatus.WATCHING,
  PLAN_TO_WATCH: ListStatus.PLAN_TO_WATCH,
  ON_HOLD: ListStatus.ON_HOLD
};

const ANILIST_QUERY = `
query ($name: String) {
  MediaListCollection(userName: $name, type: ANIME) {
    lists {
      entries {
        status
        score
        media {
          title { romaji english native }
        }
      }
    }
  }
}
`;

type AniListTitle = { romaji?: string | null; english?: string | null; native?: string | null };
type AniListEntry = { status?: string | null; score?: number | null; media?: { title?: AniListTitle } };
type AniListPayload = {
  data?: { MediaListCollection?: { lists?: { entries?: AniListEntry[] }[] } | null };
  errors?: { message?: string }[];
};

export function mapAniListStatus(raw?: string | null): ListStatus | null {
  if (!raw) return null;
  const key = raw.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return STATUS[key] ?? null;
}

export function scoreFromAniList(score?: number | null) {
  if (score == null || score <= 0) return undefined;
  const scaled = score > 10 ? Math.round(score / 10) : Math.round(score);
  if (scaled < 1 || scaled > 10) return undefined;
  return scaled;
}

export function namesFromAniList(title?: AniListTitle) {
  return [title?.english, title?.romaji, title?.native].filter((value): value is string => Boolean(value?.trim()));
}

export function entriesFromAniListLists(lists: { entries?: AniListEntry[] }[] | undefined) {
  const mapped: MappedEntry[] = [];
  for (const list of lists ?? []) {
    for (const entry of list.entries ?? []) {
      const status = mapAniListStatus(entry.status);
      const name = namesFromAniList(entry.media?.title)[0];
      if (!status || !name) continue;
      mapped.push({ name, status, score: scoreFromAniList(entry.score) });
    }
  }
  return mapped;
}

export async function fetchAniListList(username: string) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent": "Anemi/1.0"
    },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: { name: username } })
  });
  if (res.status === 404) {
    throw new Error("AniList user not found or the list is private");
  }
  if (!res.ok) {
    throw new Error(`AniList returned ${res.status}`);
  }
  const payload = (await res.json()) as AniListPayload;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || "AniList query failed");
  }
  if (!payload.data?.MediaListCollection) {
    throw new Error("AniList user not found or list is private");
  }
  return entriesFromAniListLists(payload.data.MediaListCollection.lists);
}

export function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
