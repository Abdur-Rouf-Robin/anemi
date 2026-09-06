"use client";

import Link from "next/link";
import { useState } from "react";

import type { TitleCard } from "@/lib/types";
import { cn, uniqueById } from "@/lib/utils";

import { PosterArt } from "./poster-card";

type Tab = "day" | "week" | "month";

export function TopCharts({
  charts,
  limit = 10
}: {
  charts?: { day: TitleCard[]; week: TitleCard[]; month: TitleCard[] } | null;
  limit?: number;
}) {
  const [tab, setTab] = useState<Tab>("week");
  if (!charts) return null;
  const items = uniqueById(charts[tab]).slice(0, limit);
  if (!items.length) return null;

  return (
    <aside className="overflow-hidden rounded-xl bg-surface/80 p-4 ring-1 ring-white/8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">
          <Link href="/charts" className="hover:text-accent">
            Top 10
          </Link>
        </h2>
        <div className="flex gap-1">
          {(
            [
              ["day", "Today"],
              ["week", "Week"],
              ["month", "Month"]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px]",
                tab === key ? "chip-on" : "text-muted hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ol className="mt-3 space-y-2">
        {items.map((title, index) => (
          <li key={title.id}>
            <Link href={`/title/${title.slug}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-elevated">
              <span className="w-5 text-center text-sm font-semibold text-accent">{index + 1}</span>
              <PosterArt
                name={title.name}
                hue={title.hue}
                src={title.posterUrl}
                className="h-12 w-9 shrink-0 rounded-md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{title.name}</p>
                <p className="text-[11px] text-muted">
                  {title.ageRating ?? title.type}
                  {title.score ? ` · ${title.score.toFixed(1)}` : ""}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </aside>
  );
}
