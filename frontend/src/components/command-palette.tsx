"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { api } from "@/lib/client-api";
import { TitleHitRow } from "@/components/poster-card";
import type { TitleCard } from "@/lib/types";

const COMMANDS: { href: string; label: string; primary?: boolean }[] = [
  { href: "/", label: "Home", primary: true },
  { href: "/browse", label: "Browse", primary: true },
  { href: "/browse?type=MOVIE", label: "Movies", primary: true },
  { href: "/browse?type=SERIES", label: "TV Series", primary: true },
  { href: "/browse?type=OVA", label: "OVAs" },
  { href: "/browse?type=ONA", label: "ONAs" },
  { href: "/browse?type=SPECIAL", label: "Specials" },
  { href: "/discover", label: "Discover", primary: true },
  { href: "/discover?tab=trending", label: "Trending", primary: true },
  { href: "/discover?tab=top-rated", label: "Top Rated" },
  { href: "/charts", label: "Most popular", primary: true },
  { href: "/browse?sort=score", label: "Highest rated" },
  { href: "/browse?status=AIRING", label: "Airing", primary: true },
  { href: "/browse?status=UPCOMING", label: "Upcoming", primary: true },
  { href: "/browse?status=COMPLETED", label: "Completed" },
  { href: "/latest", label: "Latest Episodes", primary: true },
  { href: "/schedule", label: "Schedule", primary: true },
  { href: "/random", label: "Random", primary: true },
  { href: "/az", label: "A–Z", primary: true },
  { href: "/studios", label: "Studios" },
  { href: "/community", label: "Community", primary: true },
  { href: "/together", label: "Watch together", primary: true },
  { href: "/library", label: "Collection", primary: true },
  { href: "/library/playlists", label: "Lists" },
  { href: "/history", label: "Watch History", primary: true },
  { href: "/notifications", label: "Updates" },
  { href: "/request", label: "Request Series", primary: true },
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/contact", label: "Contact" },
  { href: "/dmca", label: "DMCA" },
  { href: "/settings", label: "Settings", primary: true },
  { href: "/admin", label: "CMS overview" },
  { href: "/admin/titles", label: "CMS titles" },
  { href: "/admin/requests", label: "CMS requests" },
  { href: "/admin/comments", label: "CMS comments" },
  { href: "/admin/users", label: "CMS users" }
];

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<TitleCard[]>([]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("anemi-open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("anemi-open-search", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open || q.trim().length < 1) {
      setItems([]);
      return;
    }
    const handle = window.setTimeout(() => {
      api<{ items: TitleCard[] }>(`/catalog/titles?q=${encodeURIComponent(q)}&take=8`)
        .then((data) => setItems(data.items))
        .catch(() => setItems([]));
    }, 160);
    return () => window.clearTimeout(handle);
  }, [open, q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24" onClick={() => setOpen(false)}>
      <div
        className="card-panel w-full max-w-lg overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search titles, or jump to a page"
          className="h-12 w-full bg-transparent px-4 text-sm outline-none"
        />
        <ul className="max-h-80 divide-y divide-line overflow-y-auto">
          {COMMANDS.filter((command) => {
            const query = q.trim().toLowerCase();
            if (!query) return command.primary;
            return command.label.toLowerCase().includes(query);
          }).map(({ href, label }) => (
            <li key={href}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-muted hover:bg-elevated hover:text-ink"
                onClick={() => {
                  if (href === "/settings") {
                    window.dispatchEvent(new CustomEvent("anemi-open-settings", { detail: "player" }));
                    setOpen(false);
                    return;
                  }
                  router.push(href);
                  setOpen(false);
                }}
              >
                Go to {label}
              </button>
            </li>
          ))}
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-elevated"
                onClick={() => {
                  router.push(pathname.startsWith("/admin") ? `/admin/titles/${item.id}` : `/title/${item.slug}`);
                  setOpen(false);
                }}
              >
                <TitleHitRow title={item} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
