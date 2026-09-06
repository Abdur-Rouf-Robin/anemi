"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { EpisodeCard } from "@/lib/types";
import { cn, formatAirTime, weekdayLabel } from "@/lib/utils";

import { PosterArt } from "./poster-card";

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(from = new Date()) {
  const date = new Date(from);
  date.setHours(12, 0, 0, 0);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  return date;
}

export function WeekSchedule({
  days,
  compact
}: {
  days: { date: string; items: EpisodeCard[] }[];
  compact?: boolean;
}) {
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day.items])), [days]);
  const [offset, setOffset] = useState(0);
  const today = isoDay(new Date());
  const [active, setActive] = useState(today);
  const [nowLabel, setNowLabel] = useState("");

  useEffect(() => {
    const tick = () => setNowLabel(new Date().toLocaleString());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const week = useMemo(() => {
    const start = startOfWeek();
    start.setDate(start.getDate() + offset * 7);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = isoDay(date);
      return { key, items: byDate.get(key) ?? [] };
    });
  }, [byDate, offset]);

  const selected = week.find((day) => day.key === active) ?? week.find((day) => day.items.length) ?? week[0];
  const visible = compact ? (selected?.items ?? []).slice(0, 6) : (selected?.items ?? []);

  return (
    <section className="page-shell">
      <div className="card-panel overflow-hidden">
        <div className="flex items-end justify-between gap-3 border-b border-white/6 px-4 py-4 sm:px-5">
          <div>
            <p className="section-kicker">Estimated schedule</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Now{nowLabel ? ` · ${nowLabel}` : ""}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOffset((value) => value - 1)}
              className="grid size-8 place-items-center rounded-full bg-elevated text-sm ring-1 ring-white/10 hover:text-ink"
              aria-label="Previous week"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setOffset((value) => value + 1)}
              className="grid size-8 place-items-center rounded-full bg-elevated text-sm ring-1 ring-white/10 hover:text-ink"
              aria-label="Next week"
            >
              ›
            </button>
            <Link href="/schedule" className="text-xs font-semibold text-muted uppercase hover:text-accent">
              Full schedule
            </Link>
          </div>
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto px-3 pt-3 sm:px-4">
          {week.map((day) => {
            const on = day.key === (selected?.key ?? active);
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setActive(day.key)}
                className={cn(
                  "min-w-20 flex-1 rounded-xl px-2 py-3 text-center",
                  on ? "bg-white/8 text-ink" : "text-muted hover:text-ink"
                )}
              >
                <span className={cn("block text-[11px] font-semibold tracking-wider", on && "text-accent")}>
                  {weekdayLabel(day.key)}
                </span>
                <span className={cn("mt-1 block text-lg font-semibold", day.key === today && !on && "text-accent")}>
                  {new Date(`${day.key}T12:00:00`).getDate()}
                </span>
              </button>
            );
          })}
        </div>
        <ul className="divide-y divide-line px-2 py-2 sm:px-3">
          {visible.map((item) => (
            <li key={item.episodeId}>
              <Link
                href={`/watch/${item.episodeId}`}
                className="flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-elevated"
              >
                <PosterArt
                  name={item.title.name}
                  hue={item.title.hue}
                  src={item.title.posterUrl || item.title.backdropUrl}
                  className="h-12 w-9 shrink-0 rounded-md"
                />
                <span className="w-12 shrink-0 text-sm font-semibold text-muted tabular-nums">
                  {formatAirTime(item.airDate)}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{item.title.name}</span>
                <span className="shrink-0 rounded-full bg-accent px-2 py-1 text-xs font-semibold text-accent-ink sm:px-3">
                  <span className="sm:hidden">E{item.number}</span>
                  <span className="hidden sm:inline">Episode {item.number}</span>
                </span>
              </Link>
            </li>
          ))}
          {!visible.length ? (
            <li className="px-3 py-8 text-center text-sm text-muted">Nothing dated for this day.</li>
          ) : null}
        </ul>
        {compact && (selected?.items.length ?? 0) > 6 ? (
          <div className="pb-4 text-center">
            <Link href="/schedule" className="text-sm text-muted hover:text-accent">
              Show more
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
