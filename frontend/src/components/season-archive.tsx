"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;
const now = new Date();
const YEARS = Array.from({ length: 24 }, (_, index) => now.getFullYear() - index);

export function SeasonArchive() {
  const current =
    now.getMonth() < 3 ? "WINTER" : now.getMonth() < 6 ? "SPRING" : now.getMonth() < 9 ? "SUMMER" : "FALL";
  const [season, setSeason] = useState<(typeof SEASONS)[number]>(current);

  return (
    <div className="card-panel p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Seasons</h2>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {SEASONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSeason(item)}
            className={cn(
              "rounded-lg px-2 py-1.5 text-xs font-semibold capitalize ring-1 ring-white/10",
              season === item ? "chip-on" : "bg-elevated text-muted hover:text-ink"
            )}
          >
            {item.toLowerCase()}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
        {YEARS.map((year) => (
          <Link
            key={year}
            href={`/browse?season=${season}&year=${year}`}
            className="text-muted hover:text-accent"
          >
            {year}
          </Link>
        ))}
      </div>
    </div>
  );
}
