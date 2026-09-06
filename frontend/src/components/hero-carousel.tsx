"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { displayTitle } from "@/lib/display-title";
import type { TitleCard } from "@/lib/types";
import { useLocale } from "@/lib/use-locale";
import { firstEpisodeId } from "@/lib/utils";

import { PosterArt } from "./poster-card";

export function HeroCarousel({ items }: { items: TitleCard[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const id = window.setInterval(() => {
      setIndex((value) => (value + 1) % items.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [items.length, paused]);

  const locale = useLocale();
  if (!items.length) return null;
  const title = items[index] ?? items[0];
  const heading = displayTitle(title, locale);
  const playId = firstEpisodeId(title);
  const playSub = firstEpisodeId(title, "SUB");
  const playDub = firstEpisodeId(title, "DUB");
  const chips = [
    title.type === "SERIES" ? "TV" : title.type,
    title.year ? String(title.year) : null,
    title.ageRating,
    title.studio,
    title.score != null ? `★ ${title.score.toFixed(1)}` : null
  ].filter(Boolean) as string[];

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <PosterArt
        name={heading}
        hue={title.hue}
        src={title.backdropUrl || title.posterUrl}
        className="h-[min(58vh,420px)] w-full sm:h-[min(72vh,640px)]"
      />
      <div className="absolute inset-0 bg-linear-to-r from-canvas via-canvas/70 to-canvas/10" />
      <div className="absolute inset-0 bg-linear-to-t from-canvas via-transparent to-black/20" />
      <div className="page-shell absolute inset-x-0 bottom-0 space-y-3 pb-6 sm:space-y-4 sm:pb-12">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/90 ring-1 ring-white/15 backdrop-blur-sm"
            >
              {chip}
            </span>
          ))}
          {title.subCount ? (
            <span className="rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[11px] font-bold text-white">CC</span>
          ) : null}
          {title.dubCount ? (
            <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-black">Dub</span>
          ) : null}
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/90 ring-1 ring-white/15">
            HD
          </span>
        </div>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-6xl">{heading}</h1>
        <p className="line-clamp-3 max-w-xl text-sm text-white/75 sm:line-clamp-none sm:text-base">
          {title.synopsis}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {playSub && playDub ? (
            <>
              <Link
                href={`/watch/${playSub}`}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink shadow-[0_10px_30px_color-mix(in_oklch,var(--color-accent)_40%,transparent)]"
              >
                Watch Sub
              </Link>
              <Link href={`/watch/${playDub}`} className="rounded-full bg-white/12 px-6 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm">
                Watch Dub
              </Link>
            </>
          ) : playId ? (
            <Link
              href={`/watch/${playId}`}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink shadow-[0_10px_30px_color-mix(in_oklch,var(--color-accent)_40%,transparent)]"
            >
              Watch now
            </Link>
          ) : (
            <span className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-semibold text-white/80 ring-1 ring-white/10">
              Not available yet
            </span>
          )}
          <Link href={`/title/${title.slug}`} className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm ring-1 ring-white/10">
            Details
          </Link>
        </div>
        {items.length > 1 ? (
          <div className="flex gap-1.5 pt-2">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show ${item.name}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full ${i === index ? "w-8 bg-accent" : "w-3 bg-white/30"}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
