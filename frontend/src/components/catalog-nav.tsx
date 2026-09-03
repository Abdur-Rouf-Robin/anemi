"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { t, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

export const catalogLinks = [
  { href: "/browse?type=MOVIE", label: "Movies", type: "MOVIE" },
  { href: "/browse?type=SERIES", label: "Series", type: "SERIES" },
  { href: "/browse?type=ANIMATION", label: "Animation", type: "ANIMATION" },
  { href: "/browse?status=UPCOMING", label: "Coming soon", status: "UPCOMING" },
  { href: "/browse", label: "Browse" }
] as const;

function isActive(
  pathname: string,
  search: URLSearchParams,
  item: (typeof catalogLinks)[number]
) {
  if (item.href === "/browse") {
    return pathname === "/browse" && !search.get("type") && !search.get("status") && !search.get("audio");
  }
  if (!pathname.startsWith("/browse")) return false;
  if ("status" in item && item.status) return search.get("status") === item.status;
  if ("type" in item && item.type) return search.get("type") === item.type && !search.get("status");
  return false;
}

export function CatalogNav({
  variant,
  initialLocale = "en"
}: {
  variant: "bar" | "strip";
  initialLocale?: Locale;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const locale = useLocale(initialLocale);

  if (variant === "strip") {
    return (
      <nav className="no-scrollbar flex gap-2 overflow-x-auto py-2 xl:hidden">
        {catalogLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-sm ring-1 ring-white/10",
              isActive(pathname, search, item) ? "bg-accent text-accent-ink" : "bg-elevated text-muted hover:text-ink"
            )}
          >
            {t(locale, item.label)}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <>
      {catalogLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn("hover:text-ink", isActive(pathname, search, item) && "text-accent")}
        >
          {t(locale, item.label)}
        </Link>
      ))}
    </>
  );
}
