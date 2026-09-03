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
    <div className="bg-accent text-accent-ink">
      <div className="page-shell flex items-center justify-center py-2 text-center text-sm font-medium">
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
