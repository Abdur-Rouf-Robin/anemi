"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useRef } from "react";

import { PosterCard } from "@/components/poster-card";
import { usePrefs } from "@/components/settings/settings-provider";
import type { TitleCard } from "@/lib/types";

export function HomeContinue({ items }: { items: TitleCard[] }) {
  const prefs = usePrefs();
  const scroller = useRef<HTMLDivElement>(null);
  if (!prefs.showContinueWatching) return null;
  const cards = prefs.hideCaughtUp
    ? items.filter((item) => (item.progress ?? 0) < prefs.watchedThreshold)
    : items;
  if (!cards.length) return null;

  function scroll(dir: number) {
    scroller.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  }

  return (
    <section className="space-y-4">
      <div className="page-shell flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Continue Watching</h2>
          <p className="text-sm text-muted">Pick up where you left off</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="icon-btn" aria-label="Previous" onClick={() => scroll(-1)}>
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" className="icon-btn" aria-label="Next" onClick={() => scroll(1)}>
            <ChevronRight className="size-4" />
          </button>
          <Link href="/history" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <Clock className="size-4" />
            View History &gt;
          </Link>
        </div>
      </div>
      <div
        ref={scroller}
        className="page-shell no-scrollbar flex cursor-grab gap-4 overflow-x-auto pb-2 active:cursor-grabbing"
        onPointerDown={(event) => {
          if (!prefs.carouselDrag.continueWatching || event.pointerType !== "mouse") return;
          const rail = scroller.current;
          if (!rail) return;
          const startX = event.clientX;
          const startScroll = rail.scrollLeft;
          const move = (ev: PointerEvent) => {
            rail.scrollLeft = startScroll - (ev.clientX - startX);
          };
          const up = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        }}
      >
        {cards.map((item, index) => (
          <PosterCard key={`${item.id}-${item.continueEpisodeId ?? index}`} title={item} section="continueWatching" />
        ))}
      </div>
    </section>
  );
}
