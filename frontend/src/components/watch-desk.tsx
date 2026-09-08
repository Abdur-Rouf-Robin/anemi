"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { EpisodeComments } from "@/components/episode-comments";
import { EpisodeGrid } from "@/components/episode-grid";
import { EpisodeRow } from "@/components/episode-row";
import { MediaPlayer } from "@/components/player/media-player";
import { WatchStage } from "@/components/player/watch-stage";
import { PosterArt } from "@/components/poster-card";
import { TitleMeta } from "@/components/title-meta";
import { SeasonArchive } from "@/components/season-archive";
import { ShareButton } from "@/components/share-button";
import { TitleActions } from "@/components/title-actions";
import { VoteWidget } from "@/components/vote-widget";
import { WatchNextRail } from "@/components/watch-next-rail";
import { WatchTogetherButton } from "@/components/watch-together-button";
import { api } from "@/lib/client-api";
import { displayTitle } from "@/lib/display-title";
import type { TitleCard, WatchPayload } from "@/lib/types";
import { useLocale } from "@/lib/use-locale";
import { audioTrackLabel, collectCaptionOptions, formatDuration, sortAudioFiles } from "@/lib/utils";
import { mapCatalogEpisode, watchIdFromPath, type CatalogEpisodeResponse } from "@/lib/watch-map";

export function WatchDesk({
  initial,
  initialProgress = 0,
  initialRelated = []
}: {
  initial: WatchPayload;
  initialProgress?: number;
  initialRelated?: TitleCard[];
}) {
  const [data, setData] = useState(initial);
  const [progress, setProgress] = useState(initialProgress);
  const [related, setRelated] = useState(initialRelated);
  const requestRef = useRef(0);

  useEffect(() => {
    setData(initial);
    setProgress(initialProgress);
    setRelated(initialRelated);
  }, [initial.episode.id]);

  const openEpisode = useCallback(async (id: string, mode: "push" | "replace" | "silent" = "push") => {
    if (!id || id === data.episode.id) return;
    const ticket = ++requestRef.current;
    try {
      const live = await api<CatalogEpisodeResponse>(`/catalog/episodes/${id}`);
      if (ticket !== requestRef.current) return;
      const next = mapCatalogEpisode(live);
      setData(next);
      const url = `/watch/${id}`;
      if (mode === "push") window.history.pushState(null, "", url);
      else if (mode === "replace") window.history.replaceState(null, "", url);
      const pos = await api<{ positionSec: number } | null>(`/library/progress/${id}`).catch(() => null);
      if (ticket !== requestRef.current) return;
      setProgress(pos?.positionSec ?? 0);
      if (next.title.slug && next.title.slug !== data.title.slug) {
        const more = await api<{ items: TitleCard[] }>(`/catalog/titles/${next.title.slug}/related`).catch(() => null);
        if (ticket !== requestRef.current) return;
        setRelated(more?.items ?? []);
      }
    } catch {
      window.location.href = `/watch/${id}`;
    }
  }, [data.episode.id, data.title.slug]);

  useEffect(() => {
    function onPop() {
      const id = watchIdFromPath(window.location.pathname);
      if (id && id !== data.episode.id) void openEpisode(id, "silent");
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [data.episode.id, openEpisode]);

  const { episode, title, episodes, seasonNumber } = data;
  const locale = useLocale();
  const heading = displayTitle(title, locale);
  const audio = episode.audioKind ?? "SUB";
  const audioLanguage = episode.language ?? "";
  const sameNumber = sortAudioFiles(episodes.filter((item) => item.number === episode.number));
  const lane = episodes.filter(
    (item) => (item.audioKind ?? "SUB") === audio && (item.language ?? "") === audioLanguage
  );
  const index = lane.findIndex((item) => item.id === episode.id);
  const prev = index > 0 ? lane[index - 1] : undefined;
  const next = index >= 0 ? lane[index + 1] : undefined;
  const audioOptions = sameNumber.map((item) => ({
    kind: (item.audioKind ?? "SUB") as "SUB" | "DUB",
    language: item.language ?? "",
    href: `/watch/${item.id}`,
    label: audioTrackLabel(item.audioKind, item.language)
  }));
  const captionOptions = collectCaptionOptions(episode, sameNumber.length ? sameNumber : [episode]);

  function onNavigate(href: string) {
    const id = watchIdFromPath(href);
    if (id) void openEpisode(id);
    else window.location.assign(href);
  }

  return (
    <main className="watch-shell pb-8 pt-2 sm:pt-4">
      <WatchStage
        player={
          <MediaPlayer
            episodeId={episode.id}
            title={heading}
            episodeName={`${title.type === "MOVIE" ? "" : `S${seasonNumber} E${episode.number} · `}${episode.name}`}
            src={episode.videoUrl}
            durationSec={episode.durationSec}
            introStartSec={episode.introStartSec}
            introEndSec={episode.introEndSec}
            outroStartSec={episode.outroStartSec}
            startSec={progress}
            nextHref={next ? `/watch/${next.id}` : undefined}
            prevHref={prev ? `/watch/${prev.id}` : undefined}
            audioKind={audio}
            audioLanguage={audioLanguage}
            audioOptions={audioOptions}
            subtitleUrl={episode.subtitleUrl}
            captionOptions={captionOptions}
            timeKey={`${title.slug}-${episode.number}`}
            episodeNumber={episode.number}
            titleId={title.id}
            onNavigate={onNavigate}
            playlist={lane.map((item) => ({
              id: item.id,
              href: `/watch/${item.id}`,
              name: `E${item.number} · ${item.name}`
            }))}
          />
        }
        sidebar={
          <div className="flex h-full min-h-0 flex-col bg-surface/90 p-3 ring-1 ring-white/8 sm:p-4 lg:rounded-xl">
            <EpisodeGrid
              episodes={episodes}
              activeId={episode.id}
              defaultAudio={audio}
              onPick={(id) => void openEpisode(id)}
            />
          </div>
        }
      />

      <div className="mt-5 flex gap-4 rounded-xl bg-surface/90 p-4 ring-1 ring-white/8 sm:gap-5 sm:p-5">
        <Link href={`/title/${title.slug}`} className="hidden shrink-0 sm:block">
          <PosterArt
            name={heading}
            hue={title.hue}
            src={title.posterUrl || title.backdropUrl}
            className="h-40 w-[6.75rem] rounded-xl sm:h-48 sm:w-32"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/title/${title.slug}`} className="text-xl font-semibold tracking-tight hover:text-accent sm:text-2xl">
            {heading}
          </Link>
          <TitleMeta className="mt-1" title={title} />
          <p className="mt-1 text-sm text-muted">
            {title.type === "MOVIE" ? episode.name : `Episode ${episode.number} · ${episode.name}`}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              title.ageRating,
              "HD",
              title.type === "SERIES" ? "TV" : title.type,
              title.year ? String(title.year) : null,
              formatDuration(episode.durationSec),
              `${new Set(episodes.map((item) => item.number)).size} ep`,
              episodes.some((item) => (item.audioKind ?? "SUB") !== "DUB") ? "CC" : null,
              episodes.some((item) => item.audioKind === "DUB") ? "DUB" : null,
              title.studio
            ]
              .filter(Boolean)
              .map((chip) => (
                <span key={String(chip)} className="rounded-full bg-elevated px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-white/10">
                  {chip}
                </span>
              ))}
          </div>
          {title.synopsis ? <p className="mt-3 line-clamp-3 text-sm text-muted">{title.synopsis}</p> : null}
          {title.genres?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {title.genres.map((genre) => (
                <Link
                  key={genre.slug}
                  href={`/browse?genre=${genre.slug}`}
                  className="rounded-full bg-elevated px-2.5 py-1 text-xs text-muted ring-1 ring-white/10 hover:text-ink"
                >
                  {genre.name}
                </Link>
              ))}
            </div>
          ) : null}
          <div className="mt-4">{title.slug ? <VoteWidget slug={title.slug} score={title.score} /> : null}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {title.id ? <TitleActions titleId={title.id} /> : null}
            <ShareButton title={`${heading} · ${episode.name}`} />
            <WatchTogetherButton episodeId={episode.id} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <EpisodeComments episodeId={episode.id} />
        <aside className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium">Up next · {audioTrackLabel(audio, audioLanguage)}</h2>
              {next ? (
                <button type="button" onClick={() => void openEpisode(next.id)} className="text-xs text-accent">
                  Play next
                </button>
              ) : null}
            </div>
            <div className="divide-y divide-line overflow-hidden rounded-xl bg-surface/90 ring-1 ring-white/8">
              {lane.slice(Math.max(index, 0), Math.max(index, 0) + 6).map((item) => (
                <EpisodeRow
                  key={item.id}
                  episode={item}
                  active={item.id === episode.id}
                  onPick={(id) => void openEpisode(id)}
                />
              ))}
            </div>
          </div>
          <SeasonArchive />
        </aside>
      </div>
      <div className="mt-10">
        <WatchNextRail items={related} studio={title.studio} name={heading} flush />
      </div>
    </main>
  );
}
