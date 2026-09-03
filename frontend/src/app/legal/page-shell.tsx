import type { ReactNode } from "react";

export function LegalPage({
  title,
  body,
  children
}: {
  title: string;
  body: string[];
  children?: ReactNode;
}) {
  return (
    <main className="page-shell max-w-2xl py-10 pb-16">
      <div className="card-panel p-6 sm:p-8">
        <p className="section-kicker">About</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
          {body.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
        {children}
      </div>
    </main>
  );
}
