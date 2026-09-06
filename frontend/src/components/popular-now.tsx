"use client";

import Link from "next/link";
import { useState } from "react";

import type { TitleCard } from "@/lib/types";
import { cn, uniqueById } from "@/lib/utils";

import { PosterArt } from "./poster-card";
import { SectionHead } from "./section-head";

function ChartList({
  items,
  rankClass
}: {
  items: TitleCard[];
  rankClass?: string;
}) {
  return (
    <ol>
      {items.map((title, index) => (
        <li key={title.id} className="border-b border-white/6 last:border-0">
          <Link href={`/title/${title.slug}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-elevated/60">
            <span className={cn("w-6 text-sm font-semibold tabular-nums text-muted", rankClass)}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <PosterArt name={title.name} hue={title.hue} src={title.posterUrl} className="h-14 w-10 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{title.name}</p>
              <p className="truncate text-[11px] text-muted">
                {[title.type.replace("_", " "), title.studio, title.score != null ? `★ ${title.score.toFixed(1)}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {title.windowViews != null ? (
              <span className="shrink-0 text-xs font-semibold text-accent">
                {title.windowViews}
                <span className="hidden sm:inline"> views</span>
              </span>
            ) : title.viewCount ? (
              <span className="shrink-0 text-xs text-muted">
                {title.viewCount}
                <span className="hidden sm:inline"> views</span>
              </span>
            ) : (
              <span className="text-muted">›</span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function PopularNow({
  charts,
  trending,
  flush = false
}: {
  charts?: { day: TitleCard[]; week: TitleCard[]; month: TitleCard[] } | null;
  trending: TitleCard[];
  flush?: boolean;
}) {
  const [windowKey, setWindowKey] = useState<"day" | "week" | "month">("week");
  const top = uniqueById(trending).slice(0, flush ? 8 : 5);
  const rising = uniqueById(charts?.[windowKey] ?? charts?.week ?? trending).slice(0, flush ? 8 : 5);
  if (!top.length && !rising.length) return null;

  if (flush) {
    const items = rising.length ? rising : top;
    return (
      <section className="overflow-hidden rounded-xl bg-surface/80 ring-1 ring-white/8">
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
          <h2 className="text-lg font-semibold">Popular</h2>
          <div className="flex gap-1">
            {(["day", "week", "month"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setWindowKey(key)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                  windowKey === key ? "chip-on" : "text-muted hover:text-ink"
                )}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
        <ChartList items={items} rankClass="text-accent" />
      </section>
    );
  }

  return (
    <section className="page-shell">
      <SectionHead
        kicker="Charts / Audience signals"
        title="Popular now"
        href="/browse?sort=popular"
        hrefLabel="View all"
      />
      <p className="-mt-2 mb-4 text-sm text-muted">Overall favourites beside titles growing fastest this week.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="section-kicker">Top five</p>
              <p className="text-sm font-medium">Most popular overall</p>
            </div>
            <Link href="/browse?sort=popular" className="text-xs font-semibold text-muted uppercase hover:text-accent">
              View all
            </Link>
          </div>
          <ChartList items={top} rankClass="text-ink" />
        </div>
        <div className="card-panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="section-kicker">Trending</p>
              <p className="text-sm font-medium">Fastest growth</p>
            </div>
            <div className="flex items-center gap-2">
              {(["week", "day"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setWindowKey(key)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                    windowKey === key ? "chip-on" : "text-muted hover:text-ink"
                  )}
                >
                  {key === "week" ? "7 days" : "24h"}
                </button>
              ))}
              <Link href="/browse?sort=popular" className="text-xs font-semibold text-muted uppercase hover:text-accent">
                View all
              </Link>
            </div>
          </div>
          <ChartList items={rising} rankClass="text-accent" />
        </div>
      </div>
    </section>
  );
}
