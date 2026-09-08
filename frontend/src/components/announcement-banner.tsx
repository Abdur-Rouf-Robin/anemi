import Link from "next/link";

export function AnnouncementBanner({
  announcement,
  href
}: {
  announcement?: string | null;
  href?: string | null;
}) {
  if (!announcement) return null;
  const inner = <span className="line-clamp-1">{announcement}</span>;
  return (
    <div className="border-b border-accent/25 bg-[color-mix(in_oklch,var(--color-accent)_16%,var(--color-canvas))]">
      <div className="page-shell flex items-center justify-center py-1.5 text-center text-[13px] font-medium text-ink">
        {href ? (
          <Link href={href} className="hover:underline">
            {inner}
          </Link>
        ) : (
          inner
        )}
      </div>
    </div>
  );
}
