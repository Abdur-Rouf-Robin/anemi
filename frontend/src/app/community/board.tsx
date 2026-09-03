"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client-api";

const CATS = [
  { value: "", label: "All" },
  { value: "updates", label: "Updates" },
  { value: "general", label: "General" },
  { value: "suggestion", label: "Suggestion" },
  { value: "question", label: "Question" }
];

export function CommunityBoard({
  posts,
  category
}: {
  posts: { id: string; category: string; title: string; body: string; createdAt: string; displayName: string }[];
  category?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {CATS.map((item) => (
          <Link
            key={item.label}
            href={item.value ? `/community?category=${item.value}` : "/community"}
            className={`rounded-full px-3 py-1.5 text-sm ring-1 ring-white/10 ${
              (category ?? "") === item.value ? "chip-on" : "bg-elevated text-muted hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <form
        className="card-panel mt-6 space-y-2 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void api("/community/posts", {
            method: "POST",
            body: JSON.stringify({
              category: form.get("category"),
              title: form.get("title"),
              body: form.get("body")
            })
          })
            .then(() => {
              event.currentTarget.reset();
              setError("");
              router.refresh();
            })
            .catch((err: Error) => setError(err.message));
        }}
      >
        <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
          <select name="category" className="h-10 rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10">
            <option value="general">General</option>
            <option value="suggestion">Suggestion</option>
            <option value="question">Question</option>
          </select>
          <input name="title" required minLength={3} placeholder="Title" className="h-10 rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10" />
        </div>
        <textarea name="body" required minLength={8} placeholder="Write a post" className="min-h-24 w-full rounded-xl bg-elevated px-3 py-2 text-sm ring-1 ring-white/10" />
        <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
          Post
        </button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </form>
      <ul className="mt-6 space-y-3">
        {posts.map((post) => (
          <li key={post.id} className="card-panel px-4 py-3">
            <p className="text-xs text-muted">
              {post.category} · {post.displayName}
            </p>
            <h2 className="mt-1 font-medium">{post.title}</h2>
            <p className="mt-1 text-sm text-muted">{post.body}</p>
          </li>
        ))}
        {!posts.length ? (
          <li className="card-panel px-4 py-8 text-center text-sm text-muted">No posts in this category yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
