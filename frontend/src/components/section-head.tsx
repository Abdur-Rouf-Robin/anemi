import Link from "next/link";

export function SectionHead({
  kicker,
  title,
  href,
  hrefLabel = "View all"
}: {
  kicker?: string;
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="shrink-0 text-xs font-semibold tracking-wide text-muted uppercase hover:text-accent">
          {hrefLabel} →
        </Link>
      ) : null}
    </div>
  );
}
