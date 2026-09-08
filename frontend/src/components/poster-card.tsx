"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Play, Plus } from "lucide-react";

import { displayTitle } from "@/lib/display-title";
import { api } from "@/lib/client-api";
import type { TitleCard } from "@/lib/types";
import { useLocale } from "@/lib/use-locale";
import { cn, firstEpisodeId, formatAirDate } from "@/lib/utils";
import { StatusDot, TitleMeta } from "@/components/title-meta";
import { usePrefs } from "@/components/settings/settings-provider";
import type { ThumbnailSection } from "@/lib/user-settings";

export function PosterArt({
  name,
  hue,
  src,
  className,
  overlay = true,
  blur
}: {
  name: string;
  hue: number;
  src?: string | null;
  className?: string;
  overlay?: boolean;
  blur?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [src]);
  const initial = name.slice(0, 1).toUpperCase();
  const showImage = Boolean(src) && !broken;
  const prefs = usePrefs();
  const blurred = blur ?? prefs.blurThumbnails;
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
          className={cn("absolute inset-0 h-full w-full object-cover", blurred && "scale-105 blur-md")}
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
      {overlay ? <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-black/10" /> : null}
    </div>
  );
}

function CardAddButton({ titleId }: { titleId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      aria-label={saved ? "Saved" : "Add to list"}
      className="absolute top-2 right-2 z-[3] flex size-8 items-center justify-center rounded-md bg-black/70 text-white opacity-0 shadow-sm backdrop-blur-[2px] transition-opacity duration-150 group-hover:opacity-100 hover:bg-black/85"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void api<{ saved: boolean }>(`/library/later/${titleId}`, { method: "PUT" })
          .then((data) => setSaved(data.saved))
          .catch(() => router.push("/account"));
      }}
    >
      {saved ? <Check className="size-4" strokeWidth={2.25} /> : <Plus className="size-4" strokeWidth={2.25} />}
    </button>
  );
}

export function PosterHover({ titleId }: { titleId?: string }) {
  return (
    <>
      <span className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <span className="flex size-[52px] items-center justify-center rounded-full bg-white/10 ring-2 ring-white">
          <Play className="size-6 translate-x-px fill-white text-white" strokeWidth={1.5} />
        </span>
      </span>
      {titleId ? <CardAddButton titleId={titleId} /> : null}
    </>
  );
}

export function PosterCard({
  title,
  progress,
  showAirDate,
  layout = "rail",
  section = "series"
}: {
  title: TitleCard;
  progress?: number;
  showAirDate?: boolean;
  layout?: "rail" | "grid";
  section?: ThumbnailSection;
}) {
  const locale = useLocale();
  const prefs = usePrefs();
  const label = displayTitle(title, locale, prefs.titleLanguage);
  const episodeId = title.continueEpisodeId ?? firstEpisodeId(title);
  const href = episodeId ? `/watch/${episodeId}` : `/title/${title.slug}`;
  const bar = progress ?? title.progress;
  const airLabel =
    showAirDate || title.status === "UPCOMING"
      ? formatAirDate(title.nextAirDate) ?? "Soon"
      : null;
  const finished = title.status === "COMPLETED" || (title.progress ?? 0) >= (prefs.watchedThreshold ?? 85);
  const kind = prefs.thumbnailType[section] ?? "poster";
  const art = kind === "frame" ? title.backdropUrl || title.posterUrl : title.posterUrl || title.backdropUrl;
  const blur = prefs.blurThumbnails && !(prefs.unblurWatched && finished);
  const landscape = layout !== "grid" && kind === "frame";

  return (
    <div
      className={cn(
        "group",
        layout === "grid" ? "w-full" : landscape ? "w-[210px] shrink-0 sm:w-[268px]" : "w-[132px] shrink-0 sm:w-[168px]",
        finished && prefs.dimCompleted && "opacity-55",
        finished && prefs.grayscaleCompleted && "grayscale"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-[10px] bg-elevated",
          landscape ? "aspect-video" : "aspect-2/3"
        )}
      >
        <Link href={href} className="absolute inset-0" aria-label={label}>
          <PosterArt name={label} hue={title.hue} src={art} className="absolute inset-0" overlay={false} blur={blur} />
        </Link>
        <PosterHover titleId={title.id} />
        {airLabel ? (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-linear-to-t from-black/90 to-black/25 px-2 pt-6 pb-2 text-center text-[11px] font-semibold tracking-wide text-white">
            {airLabel}
          </span>
        ) : null}
        {bar && !airLabel ? (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-1 bg-black/40">
            <span className="block h-full bg-accent" style={{ width: `${bar}%` }} />
          </span>
        ) : null}
      </div>
      <Link href={href} className="mt-1.5 block min-w-0">
        <p className="flex items-center gap-1.5">
          <StatusDot status={title.status} />
          <span className="truncate text-[13px] font-semibold leading-snug group-hover:text-[#eab308]">{label}</span>
        </p>
        <TitleMeta title={title} className="mt-1" />
      </Link>
    </div>
  );
}

export function PosterGrid({ items }: { items: TitleCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {items.map((title) => (
        <PosterCard key={title.id} title={title} layout="grid" />
      ))}
    </div>
  );
}

export function TitleHitRow({ title }: { title: TitleCard }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <PosterArt
        name={title.name}
        hue={title.hue}
        src={title.posterUrl}
        className="h-12 w-9 shrink-0 rounded-md"
        overlay={false}
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <StatusDot status={title.status} />
          <span className="truncate font-semibold">{title.name}</span>
        </span>
        <TitleMeta title={title} className="mt-0.5" />
      </span>
    </span>
  );
}
