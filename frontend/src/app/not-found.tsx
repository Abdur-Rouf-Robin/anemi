import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell max-w-lg py-24 text-center">
      <p className="section-kicker">404</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-2 text-sm text-muted">That title or episode is not in the catalog.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">
          Back home
        </Link>
        <Link href="/browse" className="rounded-full bg-elevated px-5 py-2 text-sm ring-1 ring-white/10">
          Browse
        </Link>
      </div>
    </main>
  );
}
