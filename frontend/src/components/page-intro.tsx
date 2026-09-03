import type { ReactNode } from "react";

export function PageIntro({
  kicker,
  title,
  blurb,
  actions
}: {
  kicker?: string;
  title: string;
  blurb?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {blurb ? <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">{blurb}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
