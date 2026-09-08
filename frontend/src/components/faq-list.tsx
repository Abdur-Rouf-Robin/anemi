"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type FaqGroup = { heading: string; items: { q: string; a: string }[] };

export function FaqList({ groups }: { groups: FaqGroup[] }) {
  const [open, setOpen] = useState<string | null>(groups[0]?.items[0]?.q ?? null);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.heading}>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">{group.heading}</h2>
          <div className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
            {group.items.map((item) => {
              const on = open === item.q;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium hover:bg-elevated"
                    onClick={() => setOpen(on ? null : item.q)}
                    aria-expanded={on}
                  >
                    {item.q}
                    <span className={cn("text-muted", on && "text-ink")}>{on ? "–" : "+"}</span>
                  </button>
                  {on ? <p className="px-4 pb-4 text-sm leading-6 text-muted">{item.a}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
