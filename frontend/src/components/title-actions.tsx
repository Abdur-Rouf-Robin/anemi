"use client";

import { Bell, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PlaylistPicker } from "@/components/playlist-picker";
import { api } from "@/lib/client-api";
import type { ListStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES: { value: ListStatus; label: string }[] = [
  { value: "WATCHING", label: "Watching" },
  { value: "PLAN_TO_WATCH", label: "Plan to watch" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "DROPPED", label: "Dropped" },
  { value: "COMPLETED", label: "Completed" }
];

export function TitleActions({
  titleId,
  compact = false,
  variant = "default"
}: {
  titleId: string;
  compact?: boolean;
  variant?: "default" | "detail";
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [listStatus, setListStatus] = useState<ListStatus | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ saved: boolean; following: boolean; listStatus: ListStatus | null }>(`/library/flags/${titleId}`)
      .then((flags) => {
        setSaved(flags.saved);
        setFollowing(flags.following);
        setListStatus(flags.listStatus);
        setReady(true);
      })
      .catch(() => setReady(false));
  }, [titleId]);

  async function toggle(kind: "later" | "follow") {
    try {
      if (kind === "later") {
        const result = await api<{ saved: boolean }>(`/library/later/${titleId}`, { method: "PUT" });
        setSaved(result.saved);
      } else {
        const result = await api<{ following: boolean }>(`/library/follow/${titleId}`, {
          method: "PUT"
        });
        setFollowing(result.following);
      }
      router.refresh();
    } catch {
      router.push("/account");
    }
  }

  async function setStatus(status: ListStatus | "") {
    try {
      if (!status) {
        await api(`/library/list/${titleId}`, { method: "DELETE" });
        setListStatus(null);
      } else {
        const result = await api<{ status: ListStatus }>(`/library/list/${titleId}`, {
          method: "PUT",
          body: JSON.stringify({ status })
        });
        setListStatus(result.status);
      }
      router.refresh();
    } catch {
      router.push("/account");
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => toggle("later")}
        className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold ring-1 ring-white/15"
      >
        {ready && saved ? "In watchlist" : "+ Watchlist"}
      </button>
    );
  }

  if (variant === "detail") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={listStatus ?? ""}
          onChange={(event) => void setStatus(event.target.value as ListStatus | "")}
          className="h-10 rounded-lg bg-elevated px-3 text-sm font-semibold ring-1 ring-line"
        >
          <option value="">Add to Collection</option>
          {STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label={saved ? "Saved" : "Favorite"}
          onClick={() => void toggle("later")}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-lg ring-1 ring-line",
            saved ? "bg-ink text-accent-ink" : "bg-elevated text-muted hover:text-ink"
          )}
        >
          <Heart className={cn("size-4", saved && "fill-current")} />
        </button>
        <button
          type="button"
          aria-label={following ? "Following" : "Notify"}
          onClick={() => void toggle("follow")}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-lg ring-1 ring-line",
            following ? "bg-ink text-accent-ink" : "bg-elevated text-muted hover:text-ink"
          )}
        >
          <Bell className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={listStatus ?? ""}
        onChange={(event) => void setStatus(event.target.value as ListStatus | "")}
        className="h-10 rounded-full bg-elevated px-4 text-sm ring-1 ring-white/10"
      >
        <option value="">Add to list</option>
        {STATUSES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => toggle("later")}
        className="rounded-full bg-elevated px-5 py-2 text-sm ring-1 ring-white/10"
      >
        {ready && saved ? "Saved" : "Watch later"}
      </button>
      <button
        type="button"
        onClick={() => toggle("follow")}
        className="rounded-full bg-elevated px-5 py-2 text-sm ring-1 ring-white/10"
      >
        {ready && following ? "Following" : "Follow"}
      </button>
      <PlaylistPicker titleId={titleId} />
    </div>
  );
}
