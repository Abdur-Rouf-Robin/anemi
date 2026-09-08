import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";

export function LegalDoc({
  title,
  blurb,
  children
}: {
  title: string;
  blurb?: string;
  children: ReactNode;
}) {
  return (
    <main className="page-shell max-w-3xl py-8 pb-16 xl:py-10">
      <PageHeader title={title} blurb={blurb} />
      <p className="mb-8 rounded-[var(--radius-control)] bg-elevated px-3 py-2 text-xs text-muted">
        This page is general information about using Anemi, not legal advice.
      </p>
      <article className="legal-doc space-y-8">{children}</article>
    </main>
  );
}

export function LegalSection({
  title,
  kicker,
  children
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <section>
      {kicker ? <p className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{kicker}</p> : null}
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-6 text-muted">{children}</div>
    </section>
  );
}
