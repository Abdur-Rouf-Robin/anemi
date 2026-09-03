import Link from "next/link";

export function EmptyState({
  title,
  blurb,
  href = "/",
  hrefLabel = "Back home"
}: {
  title: string;
  blurb: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="card-panel mt-10 px-6 py-14 text-center">
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{blurb}</p>
      <Link href={href} className="mt-5 inline-flex rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">
        {hrefLabel}
      </Link>
    </div>
  );
}
