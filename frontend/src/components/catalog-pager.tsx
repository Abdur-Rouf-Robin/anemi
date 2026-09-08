import Link from "next/link";

import { cn } from "@/lib/utils";

export function CatalogPager({
  page,
  total,
  take,
  hrefFor
}: {
  page: number;
  total: number;
  take: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / take));
  if (pages <= 1) return null;
  const current = Math.min(Math.max(1, page), pages);
  const window = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - current) <= 2
  );

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pages">
      {current > 1 ? (
        <Link href={hrefFor(current - 1)} className="rounded-full bg-elevated px-3 py-1.5 text-sm text-muted ring-1 ring-line hover:text-ink">
          Previous
        </Link>
      ) : null}
      {window.map((n, index) => {
        const prev = window[index - 1];
        return (
          <span key={n} className="contents">
            {prev && n - prev > 1 ? <span className="px-1 text-muted">…</span> : null}
            <Link
              href={hrefFor(n)}
              className={cn(
                "grid min-w-9 place-items-center rounded-full px-3 py-1.5 text-sm ring-1 ring-line",
                n === current ? "chip-on" : "bg-elevated text-muted hover:text-ink"
              )}
            >
              {n}
            </Link>
          </span>
        );
      })}
      {current < pages ? (
        <Link href={hrefFor(current + 1)} className="rounded-full bg-elevated px-3 py-1.5 text-sm text-muted ring-1 ring-line hover:text-ink">
          Next
        </Link>
      ) : null}
    </nav>
  );
}
