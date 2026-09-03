import Link from "next/link";

import { cn } from "@/lib/utils";

const LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

export function AzStrip({
  active,
  heading = true
}: {
  active?: string;
  heading?: boolean;
}) {
  return (
    <section className="page-shell">
      {heading ? (
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-semibold tracking-tight">A–Z List</h2>
          <p className="text-xs text-muted">Search titles in alphabetical order</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/az"
          className={cn(
            "rounded-md px-2.5 py-1 text-sm ring-1 ring-white/10",
            !active || active === "All" ? "chip-on" : "bg-elevated text-muted hover:text-ink"
          )}
        >
          All
        </Link>
        {LETTERS.map((item) => (
          <Link
            key={item}
            href={`/az?letter=${encodeURIComponent(item)}`}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm ring-1 ring-white/10",
              active === item ? "chip-on" : "bg-elevated text-muted hover:text-ink"
            )}
          >
            {item}
          </Link>
        ))}
      </div>
    </section>
  );
}
