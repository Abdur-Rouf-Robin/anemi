"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PosterArt } from "@/components/poster-card";
import { StatusDot, TitleMeta } from "@/components/title-meta";
import { api } from "@/lib/client-api";
import type { TitleCard } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export function HistoryRow({
  episodeId,
  episodeName,
  watchedAt,
  title
}: {
  episodeId: string;
  episodeName: string;
  watchedAt: string;
  title: TitleCard;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <li className="flex items-center gap-2 px-2">
      <Link href={`/watch/${episodeId}`} className="flex min-w-0 flex-1 items-center gap-3 px-2 py-3 hover:bg-elevated">
        <PosterArt name={title.name} hue={title.hue} src={title.posterUrl} className="h-14 w-10 shrink-0 rounded-md" overlay={false} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <StatusDot status={title.status} />
            <span className="block truncate font-medium">{title.name}</span>
          </span>
          <span className="text-sm text-muted">{episodeName}</span>
          <TitleMeta title={title} className="mt-0.5" />
        </span>
        {watchedAt ? <span className="shrink-0 text-xs text-muted">{formatRelativeTime(watchedAt)}</span> : null}
      </Link>
      <button
        type="button"
        disabled={pending}
        className="mr-2 shrink-0 text-xs text-muted hover:text-ink disabled:opacity-60"
        onClick={() => {
          setPending(true);
          void api(`/library/history/${episodeId}`, { method: "DELETE" })
            .then(() => router.refresh())
            .finally(() => setPending(false));
        }}
      >
        {pending ? "…" : "Remove"}
      </button>
    </li>
  );
}
