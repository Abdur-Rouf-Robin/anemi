"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "@/lib/client-api";
import type { ListStatus } from "@/lib/types";

const STATUSES: { value: ListStatus; label: string }[] = [
  { value: "WATCHING", label: "Watching" },
  { value: "PLAN_TO_WATCH", label: "Plan to watch" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "DROPPED", label: "Dropped" },
  { value: "COMPLETED", label: "Completed" }
];

export function TitleActions({ titleId, compact = false }: { titleId: string; compact?: boolean }) {
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
    </div>
  );
}
