import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(sec?: number | null) {
  if (!sec) return "";
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

export function formatClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function firstEpisodeId(
  title: {
    seasons?: { episodes?: { id: string; audioKind?: string }[] }[];
  },
  kind?: "SUB" | "DUB"
) {
  const episodes = title.seasons?.[0]?.episodes ?? [];
  if (kind === "DUB") return episodes.find((item) => item.audioKind === "DUB")?.id ?? null;
  if (kind === "SUB") return episodes.find((item) => item.audioKind !== "DUB")?.id ?? episodes[0]?.id ?? null;
  return episodes.find((item) => item.audioKind !== "DUB")?.id ?? episodes[0]?.id ?? null;
}

export function formatAirDate(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric"
  });
}

export function formatAirTime(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatRelativeTime(iso?: string | null) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diff = Date.now() - then;
  if (diff < 0) return formatAirDate(iso);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return formatAirDate(iso);
}

export function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function weekdayLabel(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
}

export function dayNum(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return String(date.getDate()).padStart(2, "0");
}

export function audioTrackLabel(kind?: string | null, language?: string | null) {
  const lang = (language ?? "").trim();
  if (kind === "DUB") return lang && !/^dub$/i.test(lang) ? `${lang} Dub` : "Dub";
  if (lang && !/^original$/i.test(lang)) return `Original · ${lang}`;
  return "Original";
}

export function captionTrackLabel(language?: string | null) {
  const lang = (language ?? "").trim();
  return lang || "Captions";
}

export function sortAudioFiles<T extends { number?: number; audioKind?: string | null; language?: string | null }>(
  items: T[]
) {
  return [...items].sort((a, b) => {
    if ((a.number ?? 0) !== (b.number ?? 0)) return (a.number ?? 0) - (b.number ?? 0);
    const ak = a.audioKind === "DUB" ? 1 : 0;
    const bk = b.audioKind === "DUB" ? 1 : 0;
    if (ak !== bk) return ak - bk;
    return (a.language ?? "").localeCompare(b.language ?? "", undefined, { sensitivity: "base" });
  });
}

export function collectCaptionOptions(
  current: {
    id?: string;
    language?: string | null;
    subtitleUrl?: string | null;
    captions?: { language: string; url: string }[];
  },
  files: {
    id?: string;
    language?: string | null;
    subtitleUrl?: string | null;
    captions?: { language: string; url: string }[];
  }[]
) {
  const byLang = new Map<string, { language: string; url: string }>();
  const ordered = [current, ...files.filter((item) => item.id !== current.id)];
  for (const item of ordered) {
    for (const track of item.captions ?? []) {
      const key = track.language.trim().toLowerCase();
      if (!track.url || byLang.has(key)) continue;
      byLang.set(key, { language: track.language, url: track.url });
    }
    if (item.subtitleUrl) {
      const language = (item.language || "Captions").trim() || "Captions";
      const key = language.toLowerCase();
      if (!byLang.has(key) && ![...byLang.values()].some((track) => track.url === item.subtitleUrl)) {
        byLang.set(key, { language, url: item.subtitleUrl });
      }
    }
  }
  return [...byLang.values()];
}

export function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
