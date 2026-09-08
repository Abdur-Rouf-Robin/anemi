"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownAZ, Eye, MessageSquare, Star } from "lucide-react";

import { PosterArt, PosterGrid } from "@/components/poster-card";
import type { Episode, TitleCard } from "@/lib/types";
import { cn, formatClock, isPlayableEpisode } from "@/lib/utils";

export function NextEpisodeCountdown({ at }: { at: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function tick() {
      const ms = new Date(at).getTime() - Date.now();
      if (!Number.isFinite(ms) || ms <= 0) {
        setLabel("Soon");
        return;
      }
      const days = Math.floor(ms / 86_400_000);
      const hours = Math.floor((ms % 86_400_000) / 3_600_000);
      const minutes = Math.floor((ms % 3_600_000) / 60_000);
      const seconds = Math.floor((ms % 60_000) / 1000);
      setLabel(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [at]);

  return (
    <div className="rounded-lg bg-emerald-600 px-3 py-2.5 text-center text-sm font-semibold tracking-wide text-white">
      NEXT EPISODE {label}
    </div>
  );
}

type EpisodeGroup = {
  number: number;
  name: string;
  durationSec?: number | null;
  href: string | null;
  subCount: number;
  audCount: number;
  comments: number;
  views: number;
};

function groupEpisodes(episodes: Episode[]): EpisodeGroup[] {
  const buckets = new Map<number, Episode[]>();
  for (const episode of episodes) {
    const list = buckets.get(episode.number) ?? [];
    list.push(episode);
    buckets.set(episode.number, list);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([number, files]) => {
      const sub = files.filter((item) => (item.audioKind ?? "SUB") !== "DUB");
      const dub = files.filter((item) => item.audioKind === "DUB");
      const primary = sub[0] ?? files[0];
      const playable = files.find((item) => isPlayableEpisode(item));
      return {
        number,
        name: primary.name,
        durationSec: primary.durationSec,
        href: playable?.id ? `/watch/${playable.id}` : null,
        subCount: Math.max(sub.filter((item) => item.subtitleUrl).length, sub.length ? 1 : 0),
        audCount: Math.max(new Set(files.map((item) => item.audioKind ?? "SUB")).size, 1),
        comments: files.reduce((sum, item) => sum + (item.commentCount ?? 0), 0),
        views: files.reduce((sum, item) => sum + (item.viewCount ?? 0), 0)
      };
    });
}

export function TitleEpisodePanel({
  seasons,
  type,
  related,
  art
}: {
  seasons: { number: number; name?: string | null; episodes: Episode[] }[];
  type: string;
  related: TitleCard[];
  art?: string | null;
}) {
  const [tab, setTab] = useState<"episodes" | "relations" | "recommendations">("episodes");
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [newest, setNewest] = useState(false);
  const season = seasons[seasonIndex] ?? seasons[0];
  const groups = useMemo(() => {
    const items = groupEpisodes(season?.episodes ?? []);
    return newest ? [...items].reverse() : items;
  }, [season, newest]);

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line">
        <div className="flex gap-1">
          {(
            [
              ["episodes", "Episodes"],
              ["relations", "Relations"],
              ["recommendations", "Recommendations"]
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "border-b-2 px-3 py-2.5 text-sm font-semibold",
                tab === id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "episodes" ? (
          <div className="flex items-center gap-2 pb-1">
            {seasons.length > 1 ? (
              <select
                value={seasonIndex}
                onChange={(event) => setSeasonIndex(Number(event.target.value))}
                className="h-8 rounded-md bg-elevated px-2 text-xs font-semibold ring-1 ring-line"
              >
                {seasons.map((item, index) => (
                  <option key={item.number} value={index}>
                    {item.name || (type === "MOVIE" ? "Movie" : `Season ${item.number}`)}
                  </option>
                ))}
              </select>
            ) : null}
            <span className="text-xs text-muted">{groups.length}</span>
            <button
              type="button"
              onClick={() => setNewest((value) => !value)}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-muted hover:bg-elevated hover:text-ink"
            >
              <ArrowDownAZ className="size-3.5" />
              {newest ? "Newest" : "Oldest"}
            </button>
          </div>
        ) : null}
      </div>

      {tab === "episodes" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((item) => {
            const body = (
              <>
                <div className="relative aspect-video overflow-hidden rounded-lg bg-elevated">
                  <PosterArt name={item.name} hue={40} src={art} className="absolute inset-0" overlay={false} />
                  {item.durationSec ? (
                    <span className="absolute top-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums">
                      {formatClock(item.durationSec)}
                    </span>
                  ) : null}
                  <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
                    <Eye className="size-3" />
                    {item.views}
                  </span>
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white">
                    <MessageSquare className="size-3" />
                    {item.comments}
                  </span>
                </div>
                <p className="mt-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Episode {item.number}</p>
                <p className="truncate text-sm font-medium">{item.name}</p>
                <div className="mt-2 flex items-center gap-2 border-t border-line pt-2 text-[11px] font-semibold">
                  <span className="rounded bg-elevated px-1.5 py-0.5 ring-1 ring-line">SUB {item.subCount}</span>
                  <span className="rounded bg-elevated px-1.5 py-0.5 ring-1 ring-line">AUD {item.audCount}</span>
                  <span className="ml-auto size-2 rounded-full bg-emerald-500" aria-hidden />
                </div>
              </>
            );
            if (!item.href) {
              return (
                <div key={item.number} className="opacity-60">
                  {body}
                </div>
              );
            }
            return (
              <Link key={item.number} href={item.href} className="group block">
                {body}
              </Link>
            );
          })}
          {!groups.length ? <p className="text-sm text-muted">No episodes published yet.</p> : null}
        </div>
      ) : (
        <div className="mt-5">
          {related.length ? (
            <PosterGrid items={related} />
          ) : (
            <p className="text-sm text-muted">Nothing to show here yet.</p>
          )}
        </div>
      )}
    </section>
  );
}

export function TitleScores({
  score,
  scoreCount,
  likeCount
}: {
  score?: number | null;
  scoreCount?: number | null;
  likeCount?: number | null;
}) {
  const average = score ?? 0;
  const votes = Math.max(scoreCount ?? 0, 1);
  const weighted = Math.round(average * 100) / 100;
  return (
    <div className="flex flex-wrap gap-8">
      <div className="flex items-start gap-2">
        <Star className="mt-1 size-5 fill-current text-ink" />
        <div>
          <p className="text-3xl font-bold tracking-tight">{average.toFixed(1)}</p>
          <p className="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            {votes} Average
          </p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Star className="mt-1 size-5 fill-current text-ink" />
        <div>
          <p className="text-3xl font-bold tracking-tight">{weighted.toFixed(2)}</p>
          <p className="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            {Math.max(likeCount ?? votes, 1)} Weighted
          </p>
        </div>
      </div>
    </div>
  );
}
