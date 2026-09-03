"use client";

import { useState } from "react";

import type { Episode } from "@/lib/types";
import { useT } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

import { EpisodeGrid } from "./episode-grid";
import { EpisodeRow } from "./episode-row";

export function SeasonBrowser({
  seasons,
  type
}: {
  seasons: { number: number; name?: string | null; episodes: Episode[] }[];
  type: string;
}) {
  const [index, setIndex] = useState(0);
  const tx = useT();
  const season = seasons[index] ?? seasons[0];
  if (!season) return null;

  const heading =
    type === "MOVIE" ? tx("Movie") : seasons.length > 1 ? `${tx("Season")} ${season.number}` : tx("Episodes");

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
        {seasons.length > 1 ? (
          <div className="flex gap-1 overflow-x-auto">
            {seasons.map((item, i) => (
              <button
                key={item.number}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm ring-1 ring-white/10",
                  i === index ? "chip-on" : "bg-elevated text-muted hover:text-ink"
                )}
              >
                {item.name || `${tx("Season")} ${item.number}`}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="card-panel p-4">
        <EpisodeGrid episodes={season.episodes} heading={null} />
        <div className="mt-4 divide-y divide-line">
          {season.episodes.map((episode) => (
            <EpisodeRow key={episode.id} episode={episode} />
          ))}
        </div>
      </div>
    </section>
  );
}
