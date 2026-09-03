"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { api } from "@/lib/client-api";
import type { TitleCard } from "@/lib/types";

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
          {(
            [
              ["/", "Home"],
              ["/browse", "Browse"],
              ["/browse?type=MOVIE", "Movies"],
              ["/browse?type=SERIES", "Series"],
              ["/browse?type=ANIMATION", "Animation"],
              ["/browse?status=UPCOMING", "Coming soon"],
              ["/discover", "Discover"],
              ["/schedule", "Schedule"],
              ["/az", "A–Z"],
              ["/latest", "Latest"],
              ["/community", "Community"],
              ["/together", "Watch together"],
              ["/request", "Request"],
              ["/admin", "CMS overview"],
              ["/admin/titles", "CMS titles"],
              ["/admin/requests", "CMS requests"],
              ["/admin/comments", "CMS comments"],
              ["/admin/newsletter", "CMS newsletter"],
              ["/admin/encodes", "CMS encodes"],
              ["/admin/users", "CMS users"],
              ["/admin/settings", "CMS site"],
              ["/admin/contact", "CMS contact"],
              ["/contact", "Contact"]
            ] as const
          ).map(([href, label]) => (
            <li key={href}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-muted hover:bg-elevated hover:text-ink"
                onClick={() => {
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
                {item.name}
                <span className="ml-2 text-xs text-muted">{item.year}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
