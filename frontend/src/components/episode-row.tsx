import Link from "next/link";

import type { WatchEpisode } from "@/lib/types";
import { cn, formatAirDate, formatDuration } from "@/lib/utils";

export function EpisodeRow({
  episode,
  active,
  onPick
}: {
  episode: WatchEpisode;
  active?: boolean;
  onPick?: (id: string) => void;
}) {
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
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 hover:bg-elevated",
        active && "bg-elevated ring-1 ring-white/10"
      )}
    >
      <span className="w-6 text-sm text-muted">{episode.number}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{episode.name}</p>
        <p className="text-xs text-muted">
          {formatDuration(episode.durationSec)}
          {episode.audioKind ? ` · ${episode.audioKind === "DUB" ? "Dub" : "Sub"}` : ""}
          {episode.language ? ` · ${episode.language}` : ""}
          {formatAirDate(episode.airDate) ? ` · ${formatAirDate(episode.airDate)}` : ""}
        </p>
      </div>
    </Link>
  );
}
