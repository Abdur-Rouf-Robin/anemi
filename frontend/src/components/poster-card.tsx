"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { TitleCard } from "@/lib/types";
import { cn, firstEpisodeId, formatAirDate } from "@/lib/utils";

export function PosterArt({
  name,
  hue,
  src,
  className
}: {
  name: string;
  hue: number;
  src?: string | null;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);
  const initial = name.slice(0, 1).toUpperCase();
  const showImage = Boolean(src) && !broken;
  return (
    <div
      className={cn("relative overflow-hidden bg-elevated", className)}
      style={
        showImage
          ? undefined
          : {
              background: `linear-gradient(160deg, oklch(0.42 0.12 ${hue}) 0%, oklch(0.2 0.05 ${hue}) 70%)`
            }
      }
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <>
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
          <span className="absolute bottom-3 left-3 text-5xl font-semibold tracking-tight text-white/90">
            {initial}
          </span>
        </>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-black/10" />
    </div>
  );
}

export function PosterCard({
  title,
  progress,
  showAirDate,
  layout = "rail"
}: {
  title: TitleCard;
  progress?: number;
  showAirDate?: boolean;
  layout?: "rail" | "grid";
}) {
  const episodeId = title.continueEpisodeId ?? firstEpisodeId(title);
  const href = episodeId ? `/watch/${episodeId}` : `/title/${title.slug}`;
  const bar = progress ?? title.progress;
  const airLabel =
    showAirDate || title.status === "UPCOMING"
      ? formatAirDate(title.nextAirDate) ?? "Soon"
      : null;
  const badge = airLabel
    ? null
    : title.type === "MOVIE"
      ? "Movie"
      : title.status === "AIRING"
        ? "New"
        : null;
  const art = title.posterUrl || title.backdropUrl;

  return (
    <Link
      href={href}
      className={cn("group block", layout === "grid" ? "w-full" : "w-[148px] shrink-0 sm:w-[168px]")}
    >
      <div className="poster-frame relative aspect-2/3 bg-elevated transition-transform duration-200 ease-out motion-safe:group-hover:-translate-y-1.5 motion-safe:group-hover:scale-[1.04]">
        <PosterArt name={title.name} hue={title.hue} src={art} className="absolute inset-0" />
        <span className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/92 via-black/45 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="mb-1 flex flex-wrap gap-1">
            {title.score != null ? (
              <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-ink">
                ★ {title.score.toFixed(1)}
              </span>
            ) : null}
            <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {title.type === "SERIES" ? "TV" : title.type}
            </span>
            {title.episodeCount ? (
              <span className="rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {title.episodeCount} ep
              </span>
            ) : null}
          </span>
          {title.synopsis ? (
            <span className="mb-2 line-clamp-4 text-[11px] leading-snug text-white/80">{title.synopsis}</span>
          ) : null}
          <span className="inline-flex w-fit items-center rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-ink shadow-lg">
            Watch now
          </span>
        </span>
        {badge ? (
          <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {badge}
          </span>
        ) : null}
        {!airLabel ? (
          <span className="absolute right-2 bottom-2 flex gap-1">
            {title.subCount ? (
              <span className="rounded-md bg-emerald-600/95 px-1.5 py-0.5 text-[10px] font-bold text-white">
                CC {title.subCount}
              </span>
            ) : null}
            {title.dubCount ? (
              <span className="rounded-md bg-amber-400/95 px-1.5 py-0.5 text-[10px] font-bold text-black">
                Dub {title.dubCount}
              </span>
            ) : null}
            {!title.subCount && !title.dubCount && title.episodeCount ? (
              <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] text-white">{title.episodeCount}</span>
            ) : null}
          </span>
        ) : null}
        {airLabel ? (
          <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-black/25 px-2 pt-6 pb-2 text-center text-[11px] font-semibold tracking-wide text-white">
            {airLabel}
          </span>
        ) : null}
        {bar && !airLabel ? (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
            <span className="block h-full bg-accent" style={{ width: `${bar}%` }} />
          </span>
        ) : null}
      </div>
      <div className="mt-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{title.name}</p>
        <p className="mt-0.5 text-xs text-muted">{airLabel ?? title.year ?? title.type.toLowerCase()}</p>
      </div>
    </Link>
  );
}

export function PosterGrid({ items }: { items: TitleCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {items.map((title) => (
        <PosterCard key={title.id} title={title} layout="grid" />
      ))}
    </div>
  );
}
