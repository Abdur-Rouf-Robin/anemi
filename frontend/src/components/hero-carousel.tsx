"use client";

import Link from "next/link";
import { Calendar, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useState } from "react";

import { displayTitle } from "@/lib/display-title";
import type { TitleCard } from "@/lib/types";
import { useLocale } from "@/lib/use-locale";
import { firstEpisodeId, formatCount, titleTypeLabel } from "@/lib/utils";
import { usePrefs } from "@/components/settings/settings-provider";

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
  const prefs = usePrefs();
  if (!items.length) return null;
  const title = items[index] ?? items[0];
  const heading = displayTitle(title, locale, prefs.titleLanguage);
  const playId = firstEpisodeId(title);
  const watchHref = playId ? `/watch/${playId}` : `/title/${title.slug}`;
  const genres = (title.genres ?? []).slice(0, 3);

  function step(delta: number) {
    setIndex((value) => (value + delta + items.length) % items.length);
  }

  return (
    <section
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-spotlight relative w-full overflow-hidden" role="region" aria-label="Featured shows carousel">
        <PosterArt
          name={heading}
          hue={title.hue}
          src={title.backdropUrl || title.posterUrl}
          className="hero-art absolute inset-0 bg-canvas"
          overlay={false}
          blur={false}
        />
        <div className="hero-fade pointer-events-none absolute inset-0" />
        <div className="hero-grid pointer-events-none absolute inset-y-0 left-0" />

        <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-8 xl:px-10">
          <div className="max-w-xl">
            <h1 className="hero-wordmark mb-3 line-clamp-3 text-[2.1rem] leading-[0.9] font-black sm:mb-4 sm:text-6xl xl:text-7xl">
              {heading}
            </h1>
            {title.name && title.name !== heading ? (
              <p className="hero-kicker mb-3 inline-flex max-w-full truncate px-2.5 py-1 text-[11px] font-medium sm:mb-4">
                {title.name}
              </p>
            ) : title.nameJa && title.nameJa !== heading ? (
              <p className="hero-kicker mb-3 inline-flex max-w-full truncate px-2.5 py-1 text-[11px] font-medium sm:mb-4">
                {title.nameJa}
              </p>
            ) : null}
            <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
              <span className="hero-chip rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                {titleTypeLabel(title.type)}
              </span>
              {title.year ? (
                <span className="hero-year inline-flex items-center gap-1 rounded-[var(--radius-control)] px-2 py-0.5 text-[11px] font-medium">
                  <Calendar className="size-3" />
                  {title.year}
                </span>
              ) : null}
              {(title.subCount ?? 0) > 0 ? (
                <span className="hero-chip rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide">CC</span>
              ) : null}
              {(title.dubCount ?? 0) > 0 ? (
                <span className="hero-chip rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide">DUB</span>
              ) : null}
              <span className="hero-chip inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                {formatCount(title.viewCount)} views
              </span>
              {genres.map((genre) => (
                <span key={genre.slug} className="hero-chip rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  {genre.name}
                </span>
              ))}
            </div>
            {title.synopsis ? (
              <p className="mb-5 line-clamp-3 max-w-lg text-sm leading-relaxed text-muted sm:line-clamp-4 sm:text-[15px]">
                {title.synopsis}
              </p>
            ) : null}
            <Link href={watchHref} className="hero-cta inline-flex h-11 items-center gap-2 px-5 text-sm font-semibold">
              <Play className="size-4 fill-current stroke-none" />
              Watch Now
            </Link>
          </div>
        </div>

        {items.length > 1 ? (
          <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-3">
            <button type="button" onClick={() => step(-1)} className="icon-btn" aria-label="Previous spotlight">
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex items-center gap-2">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show ${item.name}`}
                  onClick={() => setIndex(i)}
                  className={i === index ? "hero-dot-on h-1.5 w-5 rounded-full" : "hero-dot size-1.5 rounded-full"}
                />
              ))}
            </div>
            <button type="button" onClick={() => step(1)} className="icon-btn" aria-label="Next spotlight">
              <ChevronRight className="size-5" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
