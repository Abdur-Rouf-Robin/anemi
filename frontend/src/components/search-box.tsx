"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/client-api";
import { forgetSearch, readRecentSearches, rememberSearch } from "@/lib/recent-searches";
import { TitleHitRow } from "@/components/poster-card";
import type { TitleCard } from "@/lib/types";

export function SearchBox({
  autoFocus = false,
  variant = "default"
}: {
  autoFocus?: boolean;
  variant?: "default" | "sidebar" | "compact";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const defaultValue = params.get("q") ?? "";
  const inputRef = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<TitleCard[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 1) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(() => {
      api<{ items: TitleCard[] }>(`/catalog/titles?q=${encodeURIComponent(query)}&take=6`)
        .then((data) => setHits(data.items))
        .catch(() => setHits([]));
    }, 160);
    return () => window.clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(query: string) {
    const next = query.trim();
    rememberSearch(next);
    setRecent(readRecentSearches());
    setOpen(false);
    router.push(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <div ref={box} className="relative w-full">
      <form
        action="/search"
        className={
          variant === "sidebar"
            ? "search-field flex h-9 w-full items-center gap-2 px-3 focus-within:shadow-[inset_0_0_0_2px_color-mix(in_oklch,var(--color-ink)_20%,transparent)]"
            : variant === "compact"
              ? "search-field flex h-9 w-full items-center gap-2 px-3"
              : "search-field flex h-10 w-full items-center gap-2 rounded-full px-3.5 backdrop-blur-sm focus-within:shadow-[inset_0_0_0_2px_color-mix(in_oklch,var(--color-accent)_45%,transparent)]"
        }
        onSubmit={(event) => {
          event.preventDefault();
          go(inputRef.current?.value ?? "");
        }}
      >
        <Search className="size-4 shrink-0 text-muted" />
        <input
          ref={inputRef}
          id={variant === "sidebar" ? "anemi-sidebar-search" : undefined}
          name="q"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoFocus={autoFocus}
          placeholder={variant === "sidebar" || variant === "compact" ? "Search Shows..." : "Search titles"}
          className="h-full w-full bg-transparent text-sm placeholder:text-muted/70"
          aria-label="Search titles"
        />
        {variant === "sidebar" ? (
          <kbd className="search-kbd hidden shrink-0 px-1.5 py-0.5 text-[10px] font-semibold sm:inline">
            /
          </kbd>
        ) : variant === "default" ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("anemi-open-search"))}
            className="search-kbd hidden shrink-0 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide lg:inline"
          >
            Ctrl K
          </button>
        ) : null}
      </form>
      {open && (hits.length || (!q.trim() && recent.length)) ? (
        <ul className="card-panel absolute top-12 z-40 w-full overflow-hidden py-1">
          {!q.trim()
            ? recent.map((item) => (
                <li key={item} className="flex items-center">
                  <button
                    type="button"
                    className="min-w-0 flex-1 px-3 py-2 text-left text-sm hover:bg-elevated"
                    onClick={() => {
                      setQ(item);
                      go(item);
                    }}
                  >
                    {item}
                  </button>
                  <button
                    type="button"
                    className="px-2 text-xs text-muted"
                    onClick={() => {
                      forgetSearch(item);
                      setRecent(readRecentSearches());
                    }}
                  >
                    ×
                  </button>
                </li>
              ))
            : hits.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/title/${item.slug}`}
                    className="block px-3 py-2 text-sm hover:bg-elevated"
                    onClick={() => {
                      rememberSearch(q);
                      setOpen(false);
                    }}
                  >
                    <TitleHitRow title={item} />
                  </Link>
                </li>
              ))}
        </ul>
      ) : null}
    </div>
  );
}
