import { Captions, Star } from "lucide-react";

import { cn, titleTypeLabel } from "@/lib/utils";

export type TitleMetaSource = {
  type?: string | null;
  year?: number | null;
  viewCount?: number | null;
  windowViews?: number | null;
  subCount?: number | null;
  dubCount?: number | null;
  likeCount?: number | null;
  rating?: number | null;
  score?: number | null;
  episodeCount?: number | null;
  episodeTotal?: number | null;
  status?: string | null;
  slug?: string | null;
  name?: string | null;
};

function demoInt(seed: string, min: number, max: number) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return min + ((hash >>> 0) % (max - min + 1));
}

function seedKey(title: TitleMetaSource, key: string) {
  return `${title.slug || title.name || title.type || "title"}-${key}`;
}

function episodeLabel(title: TitleMetaSource) {
  const aired = title.episodeCount ?? title.subCount ?? 0;
  const total = Math.max(aired, title.episodeTotal ?? 0);
  if (title.type === "MOVIE" || title.status === "COMPLETED" || (total > 0 && aired >= total)) {
    return String(Math.max(aired, 1));
  }
  const shown = Math.max(aired, title.status === "UPCOMING" ? 0 : 1);
  const planned = total || demoInt(seedKey(title, "eps"), 12, 24);
  return `${shown} / ${Math.max(planned, shown, 1)}`;
}

function ratingLabel(title: TitleMetaSource) {
  if (title.rating != null && title.rating > 0) return String(title.rating);
  if (title.score != null && title.score > 0) return String(Math.round(title.score * 10));
  return String(demoInt(seedKey(title, "rate"), 58, 89));
}

export function StatusDot({ status, className }: { status?: string | null; className?: string }) {
  if (status === "AIRING") {
    return <span className={cn("size-2 shrink-0 rounded-full bg-[#4ade80]", className)} aria-hidden />;
  }
  if (status === "UPCOMING") {
    return <span className={cn("size-2 shrink-0 rounded-full bg-[#fbbf24]", className)} aria-hidden />;
  }
  return null;
}

export function TitleMeta({ title, className }: { title: TitleMetaSource; className?: string }) {
  const year = title.year || demoInt(seedKey(title, "year"), 1998, 2026);
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-2 overflow-hidden text-[11px] leading-none text-muted whitespace-nowrap",
        className
      )}
    >
      <span className="shrink-0">{titleTypeLabel(title.type)}</span>
      <span className="shrink-0">{year}</span>
      <span className="inline-flex shrink-0 items-center gap-0.5 tabular-nums">
        <Captions className="size-3.5 opacity-80" strokeWidth={1.75} aria-hidden />
        {episodeLabel(title)}
      </span>
      <span className="inline-flex shrink-0 items-center gap-0.5 tabular-nums">
        <Star className="size-3 opacity-80" strokeWidth={1.75} aria-hidden />
        {ratingLabel(title)}
      </span>
    </span>
  );
}
