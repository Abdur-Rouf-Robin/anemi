"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useSession } from "@/components/session-provider";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type CommentItem = {
  id: string;
  body: string;
  spoiler: boolean;
  createdAt: string;
  userId: string;
  displayName: string;
  replies?: CommentItem[];
};

export function EpisodeComments({ episodeId }: { episodeId: string }) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "top">("newest");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"comments" | "guidelines">("comments");
  const [guidelines, setGuidelines] = useState("");
  const { user } = useSession();
  const signedIn = Boolean(user);
  const meId = user?.id ?? null;

  async function load(nextSort = sort) {
    const data = await api<{ items: CommentItem[] }>(
      `/comments?episodeId=${encodeURIComponent(episodeId)}&sort=${nextSort}`
    );
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
    api<{ communityGuidelines: string | null }>("/catalog/announcement")
      .then((data) => setGuidelines((data.communityGuidelines ?? "").trim()))
      .catch(() => setGuidelines(""));
  }, [episodeId]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await api("/comments", {
        method: "POST",
        body: JSON.stringify({
          episodeId,
          body: String(data.get("body") ?? "").trim(),
          spoiler: data.get("spoiler") === "on"
        })
      });
      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post");
    }
  }

  async function remove(id: string) {
    await api(`/comments/${id}`, { method: "DELETE" });
    await load();
  }

  async function report(id: string) {
    await api(`/comments/${id}/report`, {
      method: "POST",
      body: JSON.stringify({ reason: "other" })
    });
  }

  function row(item: CommentItem) {
    const hidden = item.spoiler && !revealed[item.id];
    return (
      <li key={item.id} className="rounded-xl bg-elevated/50 px-3 py-3 ring-1 ring-white/8">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{item.displayName}</p>
          <div className="flex gap-2">
            {item.spoiler ? <span className="text-xs text-accent">Spoiler</span> : null}
            {meId === item.userId ? (
              <button type="button" onClick={() => void remove(item.id)} className="text-xs text-muted">
                Delete
              </button>
            ) : signedIn ? (
              <button type="button" onClick={() => void report(item.id)} className="text-xs text-muted">
                Report
              </button>
            ) : null}
          </div>
        </div>
        {hidden ? (
          <button type="button" onClick={() => setRevealed((prev) => ({ ...prev, [item.id]: true }))} className="mt-1 text-sm text-accent">
            Reveal spoiler
          </button>
        ) : (
          <p className="mt-1 text-sm text-muted">{item.body}</p>
        )}
      </li>
    );
  }

  return (
    <section className="card-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/8 pb-3">
        <button
          type="button"
          onClick={() => setTab("comments")}
          className={cn("text-lg font-semibold", tab === "comments" ? "text-accent" : "text-muted")}
        >
          Comments
        </button>
        <button
          type="button"
          onClick={() => setTab("guidelines")}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-white/10",
            tab === "guidelines" ? "chip-on" : "text-muted"
          )}
        >
          Community guidelines
        </button>
        <div className="ml-auto flex gap-2 text-xs">
          {(["newest", "top", "oldest"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSort(value);
                void load(value);
              }}
              className={sort === value ? "text-ink" : "text-muted"}
            >
              Sort by {value === "top" ? "top" : value}
            </button>
          ))}
        </div>
      </div>

      {tab === "guidelines" ? (
        <div className="mt-4 space-y-2 text-sm text-muted">
          {(guidelines || "Be kind. No harassment, spoilers without a mark, or links to unauthorized copies.")
            .split(/\n+/)
            .map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          <p>
            Full rules live in{" "}
            <Linkish href="/terms">Terms</Linkish> and <Linkish href="/dmca">DMCA</Linkish>.
          </p>
        </div>
      ) : (
        <>
          {signedIn ? (
            <form onSubmit={(event) => void onSubmit(event)} className="mt-4 space-y-3">
              <p className="text-sm text-muted">Comment as you</p>
              <textarea
                name="body"
                required
                minLength={2}
                maxLength={500}
                placeholder="Leave a comment"
                className="field-input min-h-28"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" name="spoiler" />
                  Spoil?
                </label>
                <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">
                  Comment
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-4 text-sm text-muted">
              <a href="/account" className="text-accent hover:underline">
                Sign in
              </a>{" "}
              to comment.
            </p>
          )}
          {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
          <ul className="mt-6 space-y-3">
            {items.length === 0 ? (
              <li className="py-10 text-center text-sm text-muted">No comments yet. Leave a comment!</li>
            ) : null}
            {items.map(row)}
          </ul>
        </>
      )}
    </section>
  );
}

function Linkish({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-accent hover:underline">
      {children}
    </a>
  );
}
