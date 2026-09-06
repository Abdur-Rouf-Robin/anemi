import Link from "next/link";

import { formatRelativeTime } from "@/lib/utils";

import { SectionHead } from "./section-head";

export function CommunityRail({
  posts
}: {
  posts: { id: string; category: string; title: string; body: string; createdAt: string; displayName: string }[];
}) {
  if (!posts.length) return null;

  return (
    <section className="page-shell space-y-4">
      <SectionHead title="Community" href="/community" hrefLabel="Board" />
      <ul className="card-panel divide-y divide-line overflow-hidden">
        {posts.map((post) => (
          <li key={post.id}>
            <Link href="/community" className="block px-4 py-3 hover:bg-elevated">
              <p className="text-[10px] font-semibold tracking-wider text-muted uppercase">{post.category}</p>
              <p className="mt-0.5 truncate font-medium">{post.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{post.body}</p>
              <p className="mt-1 text-xs text-muted">
                {post.displayName}
                {post.createdAt ? ` · ${formatRelativeTime(post.createdAt)}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
