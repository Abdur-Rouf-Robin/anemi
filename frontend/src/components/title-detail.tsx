"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownAZ, Eye, MessageSquare, Star } from "lucide-react";

import { PosterArt, PosterGrid } from "@/components/poster-card";
import type { Episode, TitleArtwork, TitleCard, TitleCharacter } from "@/lib/types";
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
  art,
  primaryGenre,
  characters = [],
  artworks = []
}: {
  seasons: { number: number; name?: string | null; episodes: Episode[] }[];
  type: string;
  related: TitleCard[];
  art?: string | null;
  primaryGenre?: { slug: string; name: string } | null;
  characters?: TitleCharacter[];
  artworks?: TitleArtwork[];
}) {
  const tabs = [
    ["episodes", "Episodes"],
    ...(characters.length ? [["characters", "Characters"] as const] : []),
    ...(artworks.length ? [["artwork", "Artwork"] as const] : []),
    ...(related.length ? [["recommendations", "Recommendations"] as const] : [])
  ] as const;
  const [tab, setTab] = useState<(typeof tabs)[number][0]>("episodes");
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [newest, setNewest] = useState(false);
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(0);
  const [range, setRange] = useState(0);
  const [jump, setJump] = useState("");
  const season = seasons[seasonIndex] ?? seasons[0];
  const groups = useMemo(() => {
    const items = groupEpisodes(season?.episodes ?? []);
    return newest ? [...items].reverse() : items;
  }, [season, newest]);
  const maxNumber = groups.reduce((max, item) => Math.max(max, item.number), 0);
  const rangeCount = Math.max(1, Math.ceil(maxNumber / 100));
  const ranged = groups.filter((item) => item.number > range * 100 && item.number <= (range + 1) * 100);
  const pageCount = Math.max(1, Math.ceil(ranged.length / pageSize));
  const visible = ranged.slice(page * pageSize, page * pageSize + pageSize);

  function jumpTo(raw: string) {
    const number = Number(raw);
    if (!Number.isFinite(number)) return;
    const index = groups.findIndex((item) => item.number === number);
    if (index < 0) return;
    const block = Math.floor((number - 1) / 100);
    setRange(block);
    const inBlock = groups.filter((item) => item.number > block * 100 && item.number <= (block + 1) * 100);
    const local = inBlock.findIndex((item) => item.number === number);
    setPage(Math.max(0, Math.floor(local / pageSize)));
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line">
        <div className="flex gap-1">
          {tabs.map(([id, label]) => (
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
                onChange={(event) => {
                  setSeasonIndex(Number(event.target.value));
                  setRange(0);
                  setPage(0);
                }}
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
            <form
              className="flex items-center gap-1"
              onSubmit={(event) => {
                event.preventDefault();
                jumpTo(jump);
              }}
            >
              <input
                value={jump}
                onChange={(event) => setJump(event.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                placeholder="Ep #"
                aria-label="Jump to episode number"
                className="h-8 w-16 rounded-md bg-elevated px-2 text-xs ring-1 ring-line"
              />
            </form>
            <button
              type="button"
              onClick={() => {
                setPageSize((size) => (size === 12 ? 24 : 12));
                setPage(0);
              }}
              className="inline-flex h-8 items-center rounded-md px-2 text-xs font-semibold text-muted hover:bg-elevated hover:text-ink"
            >
              {pageSize}
            </button>
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

      {tab === "episodes" && rangeCount > 1 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Array.from({ length: rangeCount }, (_, index) => {
            const start = index * 100 + 1;
            const end = Math.min(maxNumber, (index + 1) * 100);
            const label = `${String(start).padStart(3, "0")}–${String(end).padStart(3, "0")}`;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setRange(index);
                  setPage(0);
                }}
                className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-line", range === index ? "chip-on" : "bg-elevated text-muted hover:text-ink")}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      {tab === "characters" ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((person) => (
            <li key={person.id} className="flex gap-3 rounded-xl bg-elevated p-3 ring-1 ring-line">
              {person.imageUrl ? <img src={person.imageUrl} alt="" className="size-16 rounded-lg object-cover" /> : <span className="grid size-16 place-items-center rounded-lg bg-canvas text-xs text-muted">No art</span>}
              <div className="min-w-0">
                <p className="truncate font-semibold">{person.name}</p>
                <p className="text-xs text-muted">{person.role === "MAIN" ? "Main" : "Supporting"}</p>
                {person.actor ? <p className="mt-1 truncate text-sm">{person.actor}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "artwork" ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((piece) => (
            <li key={piece.id} className="overflow-hidden rounded-xl bg-elevated ring-1 ring-line">
              <img src={piece.url} alt={piece.caption ?? ""} className="aspect-video w-full object-cover" />
              {piece.caption ? <p className="px-3 py-2 text-sm">{piece.caption}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "episodes" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => {
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
      ) : null}
      {tab === "recommendations" ? (
        <div className="mt-5">
          {primaryGenre ? (
            <p className="mb-3 text-sm">
              <Link href={`/browse?include=${primaryGenre.slug}`} className="font-semibold hover:text-accent">
                More {primaryGenre.name}
              </Link>
            </p>
          ) : null}
          <PosterGrid items={related} />
        </div>
      ) : null}
      {tab === "episodes" && pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button type="button" className="icon-btn" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} aria-label="Previous episodes">
            ‹
          </button>
          <span className="tabular-nums text-muted">{page + 1} / {pageCount}</span>
          <button type="button" className="icon-btn" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} aria-label="Next episodes">
            ›
          </button>
        </div>
      ) : null}
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
  const votes = scoreCount ?? 0;
  const average = votes ? (score ?? 0) : null;
  const prior = 7;
  const priorWeight = 20;
  const weighted = average == null ? null : (average * votes + prior * priorWeight) / (votes + priorWeight);
  return (
    <div className="flex flex-wrap gap-8">
      <div className="flex items-start gap-2">
        <Star className="mt-1 size-5 fill-current text-ink" />
        <div>
          <p className="text-3xl font-bold tracking-tight">{average == null ? "—" : average.toFixed(1)}</p>
          <p className="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            {votes} Average
          </p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Star className="mt-1 size-5 fill-current text-ink" />
        <div>
          <p className="text-3xl font-bold tracking-tight">{weighted == null ? "—" : weighted.toFixed(2)}</p>
          <p className="mt-0.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            {likeCount ?? votes} Weighted
          </p>
        </div>
      </div>
    </div>
  );
}
