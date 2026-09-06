import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { getGenres } from "@/lib/api";
import { t } from "@/lib/i18n";
import { AccountMenu } from "./account-menu";
import { HeaderLink } from "./header-link";
import { LocaleSwitch } from "./locale-switch";
import { NotificationsBell } from "./notifications-bell";
import { SearchBox } from "./search-box";
import { ThemeToggle } from "./theme-toggle";

const discover = [
  { href: "/discover", label: "Highest rated" },
  { href: "/browse?type=MOVIE", label: "Films" },
  { href: "/browse?status=UPCOMING", label: "Airing soon" },
  { href: "/az", label: "A–Z index" },
  { href: "/browse?sort=popular", label: "Most popular" },
  { href: "/latest", label: "Latest" },
  { href: "/browse?type=SERIES", label: "Series" },
  { href: "/browse?type=OVA", label: "OVA" },
  { href: "/charts", label: "Top 10" },
  { href: "/studios", label: "Studios" }
];

export async function SiteHeader() {
  const genres = await getGenres();
  const locale = (await cookies()).get("anemi_locale")?.value === "jp" ? "jp" : "en";

  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-canvas/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
      <div className="page-shell flex h-14 items-center gap-2 sm:h-16 sm:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-ink shadow-[0_8px_20px_color-mix(in_oklch,var(--color-accent)_45%,transparent)]">
            A
          </span>
          <span className="hidden text-[17px] font-semibold tracking-[0.14em] uppercase min-[380px]:inline">Anemi</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold tracking-wide uppercase xl:flex">
          <HeaderLink href="/" exact>
            {t(locale, "Watch")}
          </HeaderLink>
          <details className="relative">
            <summary className="nav-underline cursor-pointer list-none text-muted hover:text-ink">
              {t(locale, "Discover")}
            </summary>
            <div className="card-panel absolute top-8 left-0 z-40 w-52 p-2">
              {discover.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg px-2 py-1.5 text-sm font-medium tracking-normal normal-case hover:bg-elevated">
                  {t(locale, item.label)}
                </Link>
              ))}
            </div>
          </details>
          <HeaderLink href="/schedule">{t(locale, "Schedule")}</HeaderLink>
          {genres.length ? (
            <details className="relative">
              <summary className="cursor-pointer list-none text-muted hover:text-ink">{t(locale, "Genre")}</summary>
              <div className="card-panel absolute top-8 left-0 z-40 grid w-[30rem] grid-cols-2 gap-x-1 p-3">
                {genres.map((genre) => (
                  <Link
                    key={genre.slug}
                    href={`/browse?genre=${genre.slug}`}
                    className="rounded-lg px-2 py-1.5 text-sm font-medium tracking-normal normal-case hover:bg-elevated hover:text-ink"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>
            </details>
          ) : null}
        </nav>
        <div className="mx-auto hidden w-full max-w-md md:block">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/random" className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink lg:inline">
            {t(locale, "Random")}
          </Link>
          <Link href="/together" className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink lg:inline">
            {t(locale, "Watch together")}
          </Link>
          <Link href="/community" className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink xl:inline">
            {t(locale, "Community")}
          </Link>
          <span className="hidden sm:contents">
            <LocaleSwitch />
          </span>
          <ThemeToggle />
          <NotificationsBell />
          <AccountMenu />
        </div>
      </div>
      <div className="page-shell no-scrollbar flex gap-2 overflow-x-auto py-2 xl:hidden">
        {[
          { href: "/", label: "Watch" },
          { href: "/discover", label: "Discover" },
          { href: "/schedule", label: "Schedule" },
          { href: "/latest", label: "Latest" },
          { href: "/az", label: "A–Z" },
          { href: "/together", label: "Together" },
          { href: "/random", label: "Random" }
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full bg-elevated px-3 py-1 text-sm text-muted ring-1 ring-white/10 hover:text-ink"
          >
            {t(locale, item.label)}
          </Link>
        ))}
      </div>
    </header>
  );
}

