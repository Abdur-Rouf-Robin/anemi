"use client";

import { useState } from "react";

import Link from "next/link";

import type { EpisodeCard } from "@/lib/types";
import { cn } from "@/lib/utils";

import { LatestReleaseGrid } from "./latest-release-grid";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "SUB", label: "Sub" },
  { id: "DUB", label: "Dub" }
] as const;

export function LatestHome({ items }: { items: EpisodeCard[] }) {
  const [audio, setAudio] = useState<(typeof FILTERS)[number]["id"]>("ALL");
  const filtered = audio === "ALL" ? items : items.filter((item) => item.audioKind === audio);
  if (!items.length) return null;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1 [&_.mb-4]:mb-0">
          <div>
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Latest Episodes</h2>
            <p className="text-sm text-muted">Recently released episodes</p>
          </div>
          <Link href="/latest" className="text-xs font-semibold tracking-wide text-muted uppercase hover:text-accent">
            View all →
          </Link>
        </div>
        <div className="flex gap-1 pb-0.5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAudio(item.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-line",
                audio === item.id ? "chip-on" : "bg-elevated text-muted hover:text-ink"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {filtered.length ? (
        <LatestReleaseGrid items={filtered} headed={false} flush limit={8} />
      ) : (
        <p className="text-sm text-muted">No {audio === "DUB" ? "dub" : "sub"} episodes in the latest releases.</p>
      )}
    </section>
  );
}
