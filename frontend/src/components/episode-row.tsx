import Link from "next/link";

import { episodeKindLabel } from "@/lib/display-title";
import type { WatchEpisode } from "@/lib/types";
import { cn, formatAirDate, formatDuration, isPlayableEpisode } from "@/lib/utils";

export function EpisodeRow({
  episode,
  active,
  onPick
}: {
  episode: WatchEpisode;
  active?: boolean;
  onPick?: (id: string) => void;
}) {
  const playable = isPlayableEpisode(episode);
  const body = (
    <>
      <span className="w-6 text-sm text-muted">{episode.number}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{episode.name}</p>
        <p className="text-xs text-muted">
          {formatDuration(episode.durationSec)}
          {episode.audioKind ? ` · ${episode.audioKind === "DUB" ? "Dub" : "Sub"}` : ""}
          {episode.language ? ` · ${episode.language}` : ""}
          {episodeKindLabel(episode.kind) ? ` · ${episodeKindLabel(episode.kind)}` : ""}
          {formatAirDate(episode.airDate) ? ` · ${formatAirDate(episode.airDate)}` : ""}
          {!playable ? " · Not available yet" : ""}
        </p>
      </div>
    </>
  );
  const className = cn(
    "flex items-center gap-3 px-3 py-2.5",
    playable ? "hover:bg-elevated" : "cursor-default text-muted",
    active && "bg-elevated ring-1 ring-white/10"
  );
  if (!playable) return <div className={className}>{body}</div>;
  return (
    <Link
      href={`/watch/${episode.id}`}
      prefetch={false}
      onClick={(event) => {
        if (!onPick || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }
        event.preventDefault();
        onPick(episode.id);
      }}
      className={className}
    >
      {body}
    </Link>
  );
}
