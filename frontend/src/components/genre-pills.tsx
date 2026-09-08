import Link from "next/link";

import { cn } from "@/lib/utils";

export function GenrePills({
  genres,
  padded = true
}: {
  genres: { slug: string; name: string }[];
  padded?: boolean;
}) {
  if (!genres.length) return null;
  return (
    <div className={cn("no-scrollbar flex gap-2 overflow-x-auto", padded && "page-shell")}>
      {genres.map((genre) => (
        <Link
          key={genre.slug}
          href={`/browse?genre=${genre.slug}`}
          className="shrink-0 rounded-full bg-elevated px-3.5 py-1.5 text-sm text-muted ring-1 ring-line hover:bg-surface hover:text-ink"
        >
          {genre.name}
        </Link>
      ))}
    </div>
  );
}
