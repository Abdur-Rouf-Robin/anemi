"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/lib/client-api";

type Note = { id: string; title: string; body: string; href?: string | null; read: boolean };

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);

  async function load() {
    try {
      const data = await api<{ items: Note[]; unread: number }>("/notifications");
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markAll() {
    await api("/notifications/read", { method: "PUT" });
    await load();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) void load();
        }}
        className="relative flex size-8 items-center justify-center rounded-full bg-elevated text-xs ring-1 ring-white/10"
        aria-label="Notifications"
      >
        !
        {unread ? (
          <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-accent px-1 text-[10px] text-accent-ink">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="card-panel absolute right-0 z-40 mt-2 w-72 p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-xs text-muted">Notifications</p>
            <div className="flex items-center gap-2">
              <Link href="/notifications" className="text-xs text-muted hover:text-ink" onClick={() => setOpen(false)}>
                All
              </Link>
              <button type="button" onClick={() => void markAll()} className="text-xs text-accent">
                Mark read
              </button>
            </div>
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 ? <li className="px-2 py-4 text-sm text-muted">Nothing yet.</li> : null}
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href || "/library"}
                  className={`block rounded-xl px-2 py-2 text-sm hover:bg-elevated ${item.read ? "text-muted" : "text-ink"}`}
                  onClick={() => {
                    if (!item.read) {
                      void api(`/notifications/${item.id}/read`, { method: "PUT" }).catch(() => undefined);
                    }
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">{item.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
