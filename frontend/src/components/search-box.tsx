"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const defaultValue = params.get("q") ?? "";
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action="/search"
      className="flex h-11 w-full items-center gap-2 rounded-2xl bg-elevated/80 px-3.5 ring-1 ring-white/10 backdrop-blur-sm focus-within:ring-accent/60"
      onSubmit={(event) => {
        event.preventDefault();
        const q = inputRef.current?.value.trim() ?? "";
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
      }}
    >
      <Search className="size-4 shrink-0 text-muted" />
      <input
        ref={inputRef}
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder="Search titles"
        className="h-full w-full bg-transparent text-sm placeholder:text-muted/70"
        aria-label="Search titles"
      />
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("anemi-open-search"))}
        className="hidden shrink-0 rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted ring-1 ring-white/10 lg:inline"
      >
        Ctrl K
      </button>
    </form>
  );
}
