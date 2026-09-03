"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { WatchEpisode } from "@/lib/types";
import { cn } from "@/lib/utils";

const CHUNK = 40;

export function EpisodeGrid({
  episodes,
  activeId,
  heading = "Episodes",
  defaultAudio = "ALL",
  onPick
}: {
  episodes: WatchEpisode[];
  activeId?: string;
  heading?: string | null;
  defaultAudio?: "ALL" | "SUB" | "DUB";
  onPick?: (id: string) => void;
}) {
  const hasDub = episodes.some((item) => item.audioKind === "DUB");
  const hasSub = episodes.some((item) => (item.audioKind ?? "SUB") === "SUB");
  const [audio, setAudio] = useState<"ALL" | "SUB" | "DUB">(hasSub && hasDub ? defaultAudio : "ALL");
  const [query, setQuery] = useState("");
  const [chunk, setChunk] = useState(0);
  const items = useMemo(() => {
    const lane = audio === "ALL" ? episodes : episodes.filter((item) => (item.audioKind ?? "SUB") === audio);
    const q = query.trim();
    if (!q) return lane;
    return lane.filter((item) => String(item.number).startsWith(q) || item.name.toLowerCase().includes(q.toLowerCase()));
  }, [audio, episodes, query]);
  const pages = Math.max(1, Math.ceil(items.length / CHUNK));
  const pageIndex = Math.min(chunk, pages - 1);
  const visible = items.slice(pageIndex * CHUNK, pageIndex * CHUNK + CHUNK);
  const dupNumbers = useMemo(() => {
    const counts = new Map<number, number>();
    for (const item of items) counts.set(item.number, (counts.get(item.number) ?? 0) + 1);
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([number]) => number));
  }, [items]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        {heading ? <h2 className="text-sm font-medium">{heading}</h2> : <span />}
        {hasSub && hasDub ? (
          <div className="flex gap-1">
            {(["ALL", "SUB", "DUB"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  setAudio(kind);
                  setChunk(0);
                }}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs ring-1 ring-white/10",
                  audio === kind ? "chip-on" : "bg-elevated text-muted"
                )}
              >
                {kind === "ALL" ? "All" : kind === "SUB" ? "Sub" : "Dub"}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted">{hasDub && !hasSub ? "Dub" : "Sub"}</span>
        )}
      </div>
      {items.length > 12 ? (
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setChunk(0);
          }}
          placeholder="Find number"
          className="mb-2 h-9 w-full rounded-lg bg-elevated px-3 text-sm ring-1 ring-white/10"
        />
      ) : null}
      {pages > 1 ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {Array.from({ length: pages }, (_, index) => {
            const from = index * CHUNK + 1;
            const to = Math.min(items.length, (index + 1) * CHUNK);
            return (
              <button
                key={from}
                type="button"
                onClick={() => setChunk(index)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] ring-1 ring-white/10",
                  pageIndex === index ? "chip-on" : "bg-elevated text-muted"
                )}
              >
                {String(from).padStart(3, "0")}-{String(to).padStart(3, "0")}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="grid max-h-[min(70vh,100%)] flex-1 grid-cols-5 content-start gap-1.5 overflow-y-auto sm:grid-cols-6 lg:max-h-none">
        {visible.map((episode) => (
          <Link
            key={episode.id}
            href={`/watch/${episode.id}`}
            prefetch={false}
            title={`${episode.name} · ${episode.audioKind === "DUB" ? "Dub" : "Sub"}${episode.language ? ` · ${episode.language}` : ""}`}
            onClick={(event) => {
              if (!onPick || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
                return;
              }
              event.preventDefault();
              onPick(episode.id);
            }}
            className={cn(
              "flex min-h-10 items-center justify-center rounded-md px-1 py-1 text-sm ring-1 ring-white/10 transition-colors",
              episode.id === activeId
                ? "bg-accent text-accent-ink"
                : "bg-elevated text-muted hover:bg-surface hover:text-ink"
            )}
          >
            <span className="flex flex-col items-center leading-none">
              <span>{episode.number}</span>
              {dupNumbers.has(episode.number) || (audio === "ALL" && hasSub && hasDub) ? (
                <span className="mt-0.5 max-w-full truncate px-0.5 text-[10px] opacity-70">
                  {episode.audioKind === "DUB" ? "Dub" : "Sub"}
                  {episode.language ? ` ${episode.language.slice(0, 3)}` : ""}
                </span>
              ) : null}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
