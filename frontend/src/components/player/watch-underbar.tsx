"use client";

import Link from "next/link";

import type { AudioOption } from "./audio-tracks-panel";
import { audioTrackLabel, cn } from "@/lib/utils";

export function WatchUnderbar({
  episodeNumber,
  episodeName,
  audioKind,
  audioLanguage,
  audioOptions,
  captions,
  captionLabel,
  hasCues,
  qualityLabel,
  autoPlay,
  autoNext,
  autoSkipIntro,
  theater,
  lightsOff,
  prevHref,
  nextHref,
  onNavigate,
  onTracks,
  onTheater,
  onLights,
  onPref,
  onCaptions
}: {
  episodeNumber?: number;
  episodeName: string;
  audioKind: "SUB" | "DUB";
  audioLanguage?: string | null;
  audioOptions: AudioOption[];
  captions: boolean;
  captionLabel?: string;
  hasCues: boolean;
  qualityLabel: string;
  autoPlay: boolean;
  autoNext: boolean;
  autoSkipIntro: boolean;
  theater: boolean;
  lightsOff: boolean;
  prevHref?: string;
  nextHref?: string;
  onNavigate?: (href: string) => void;
  onTracks: () => void;
  onTheater: () => void;
  onLights: () => void;
  onPref: (key: "autoPlay" | "autoNext" | "autoSkipIntro") => void;
  onCaptions: () => void;
}) {
  const currentLabel = audioTrackLabel(audioKind, audioLanguage);
  const many =
    audioOptions.length > 2 ||
    audioOptions.some((option) => (option.language ?? "").trim()) ||
    new Set(audioOptions.map((option) => option.kind)).size < audioOptions.length;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <button type="button" className="hover:text-ink" onClick={onTheater}>
          {theater ? "Exit expand" : "Expand"}
        </button>
        <Toggle label="Auto Play" on={autoPlay} onClick={() => onPref("autoPlay")} />
        <Toggle label="Auto Next" on={autoNext} onClick={() => onPref("autoNext")} />
        <Toggle label="Auto Skip" on={autoSkipIntro} onClick={() => onPref("autoSkipIntro")} />
        <button type="button" className={cn("hover:text-ink", lightsOff && "text-accent")} onClick={onLights}>
          {lightsOff ? "Lights on" : "Lights off"}
        </button>
        {prevHref ? (
          <button
            type="button"
            className="hover:text-ink"
            onClick={() => (onNavigate ? onNavigate(prevHref) : undefined)}
          >
            Prev
          </button>
        ) : null}
        {nextHref ? (
          <button
            type="button"
            className="hover:text-ink"
            onClick={() => (onNavigate ? onNavigate(nextHref) : undefined)}
          >
            Next
          </button>
        ) : null}
      </div>
      <div className="card-panel flex flex-wrap items-center gap-2 px-3 py-2.5">
        <p className="mr-auto min-w-0 text-sm">
          <span className="text-muted">You’re watching </span>
          <span className="font-medium">
            {episodeNumber != null ? `Episode ${episodeNumber}` : episodeName}
          </span>
        </p>
        <button
          type="button"
          onClick={onTracks}
          className="rounded-full bg-elevated px-3 py-1 text-xs font-semibold ring-1 ring-white/10 hover:text-ink"
        >
          Audio · {currentLabel}
        </button>
        {audioOptions.length > 1 ? (
          <span className="flex flex-wrap rounded-full bg-elevated p-0.5 ring-1 ring-white/10">
            {audioOptions.map((option) => {
              const active =
                option.kind === audioKind &&
                (option.language ?? "").trim().toLowerCase() === (audioLanguage ?? "").trim().toLowerCase();
              const label = many
                ? option.label ?? audioTrackLabel(option.kind, option.language)
                : option.kind === "DUB"
                  ? "Dub"
                  : "Sub";
              return (
                <Link
                  key={`${option.kind}-${option.language ?? ""}-${option.href}`}
                  href={option.href}
                  prefetch={false}
                  onClick={(event) => {
                    if (!onNavigate || event.metaKey || event.ctrlKey || event.button !== 0) return;
                    event.preventDefault();
                    onNavigate(option.href);
                  }}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    active ? "chip-on" : "text-muted hover:text-ink"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </span>
        ) : (
          <span className="rounded-full bg-elevated px-2.5 py-1 text-[11px] font-semibold ring-1 ring-white/10">
            {currentLabel}
          </span>
        )}
        <button
          type="button"
          onClick={onCaptions}
          disabled={!hasCues}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-white/10 disabled:opacity-40",
            captions && hasCues ? "chip-on" : "bg-elevated text-muted"
          )}
        >
          CC {captions && hasCues ? captionLabel || "On" : "Off"}
        </button>
        <span className="rounded-full bg-elevated px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-white/10">
          {qualityLabel}
        </span>
      </div>
    </div>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("hover:text-ink", on && "text-accent")}>
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}
