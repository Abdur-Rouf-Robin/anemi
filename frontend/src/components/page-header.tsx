import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  blurb,
  actions,
  uppercase
}: {
  title: string;
  blurb?: string;
  actions?: ReactNode;
  uppercase?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className={cn("text-2xl font-bold tracking-tight md:text-3xl", uppercase && "font-semibold uppercase")}>
          {title}
        </h1>
        {blurb ? <p className="text-sm text-muted md:text-base">{blurb}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
