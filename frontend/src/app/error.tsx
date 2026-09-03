"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page-shell max-w-lg py-24 text-center">
      <p className="section-kicker">Error</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">Refresh, or go back and try that page again.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink"
      >
        Try again
      </button>
    </main>
  );
}
