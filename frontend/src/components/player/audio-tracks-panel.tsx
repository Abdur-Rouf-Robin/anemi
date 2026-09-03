"use client";

import { audioTrackLabel, captionTrackLabel, cn } from "@/lib/utils";

export type AudioOption = {
  kind: "SUB" | "DUB";
  href: string;
  language?: string;
  label?: string;
};

export type CaptionOption = {
  language: string;
  url: string;
};

export function AudioTracksPanel({
  audioKind,
  audioLanguage,
  audioOptions,
  captions,
  captionLanguage,
  captionOptions,
  onClose,
  onAudio,
  onCaptions
}: {
  audioKind: "SUB" | "DUB";
  audioLanguage?: string | null;
  audioOptions: AudioOption[];
  captions: boolean;
  captionLanguage?: string | null;
  captionOptions: CaptionOption[];
  onClose: () => void;
  onAudio: (href: string) => void;
  onCaptions: (on: boolean, language?: string, url?: string) => void;
}) {
  const tracks = audioOptions.length ? audioOptions : [{ kind: audioKind, href: "", language: audioLanguage ?? "" }];

  return (
    <div className="absolute right-3 bottom-16 z-30 w-[min(100%-1.5rem,24rem)] rounded-2xl bg-black/92 p-4 text-white shadow-2xl ring-1 ring-white/15">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold tracking-wide">Audio & Subtitles</p>
        <button type="button" className="text-xs text-white/50 hover:text-white" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">Audio</p>
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {tracks.map((track) => {
              const label = track.label ?? audioTrackLabel(track.kind, track.language);
              const isActive =
                track.kind === audioKind &&
                (track.language ?? "").trim().toLowerCase() === (audioLanguage ?? "").trim().toLowerCase();
              return (
                <li key={`${track.kind}-${track.language ?? ""}-${track.href}`}>
                  <button
                    type="button"
                    disabled={isActive || !track.href}
                    onClick={() => track.href && onAudio(track.href)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                      isActive ? "bg-white/10" : "hover:bg-white/8 text-white/80"
                    )}
                  >
                    <span className={cn("mt-0.5 size-2.5 shrink-0 rounded-full ring-1 ring-white/40", isActive && "bg-accent ring-accent")} />
                    <span>
                      <span className="block font-medium">{label}</span>
                      <span className="block text-[11px] text-white/50">
                        {track.kind === "DUB" ? "Spoken translation" : "Original voices"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">Subtitles</p>
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => onCaptions(false)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                  !captions ? "bg-white/10" : "hover:bg-white/8 text-white/80"
                )}
              >
                <span className={cn("size-2.5 rounded-full ring-1 ring-white/40", !captions && "bg-accent ring-accent")} />
                Off
              </button>
            </li>
            {captionOptions.length ? (
              captionOptions.map((track) => {
                const active = captions && captionLanguage === track.language;
                return (
                  <li key={`${track.language}-${track.url}`}>
                    <button
                      type="button"
                      onClick={() => onCaptions(true, track.language, track.url)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                        active ? "bg-white/10" : "hover:bg-white/8 text-white/80"
                      )}
                    >
                      <span className={cn("size-2.5 shrink-0 rounded-full ring-1 ring-white/40", active && "bg-accent ring-accent")} />
                      <span className="block font-medium">{captionTrackLabel(track.language)}</span>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="px-2 py-1.5 text-sm text-white/40">None attached</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
