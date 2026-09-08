"use client";

import Link from "next/link";
import { useState } from "react";

import { api } from "@/lib/client-api";
import { useT } from "@/lib/use-locale";

import { LocaleSwitch } from "./locale-switch";

export function SiteFooter({ genres = [] }: { genres?: { slug: string; name: string }[] }) {
  const [note, setNote] = useState("");
  const [openGenres, setOpenGenres] = useState(false);
  const tx = useT();

  return (
    <footer className="mt-12 border-t border-line bg-surface sm:mt-16">
      <div className="page-shell grid gap-8 border-b border-line py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <p className="section-kicker">Weekly dispatch</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">The week ahead, curated.</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            New episodes, next week’s schedule, and one editor’s pick — sent when you subscribe.
          </p>
        </div>
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            const email = String(new FormData(event.currentTarget).get("email") ?? "");
            void api("/newsletter", { method: "POST", body: JSON.stringify({ email }) })
              .then(() => setNote("Subscribed."))
              .catch((err: Error) => setNote(err.message));
          }}
        >
          <label className="sr-only" htmlFor="footer-email">
            Email address
          </label>
          <input
            id="footer-email"
            name="email"
            type="email"
            required
            placeholder="your@email.com"
            className="h-12 flex-1 rounded-xl bg-elevated px-4 text-sm ring-1 ring-line"
          />
          <button type="submit" className="btn btn-primary h-12 rounded-xl px-5 text-sm">
            Subscribe
          </button>
        </form>
        {note ? <p className="text-sm text-muted lg:col-span-2">{note}</p> : null}
      </div>

      <div className="page-shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <p className="flex items-center gap-2 font-semibold">
            <span className="brand-mark grid size-8 place-items-center rounded-md text-xs font-bold">A</span>
            ANEMI
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            {tx("Search, tap, watch. Built for video you own or license — not a scrape of other catalogs.")}
          </p>
          <p className="section-kicker mt-5">Language</p>
          <div className="mt-2">
            <LocaleSwitch />
          </div>
        </div>
        <FooterCol
          title="Watch"
          links={[
            ["/latest", "Latest"],
            ["/feed/latest.xml", "RSS"],
            ["/schedule", "Schedule"],
            ["/feed/schedule.ics", "Calendar"]
          ]}
        />
        <FooterCol
          title="Discover"
          links={[
            ["/browse?sort=score", "Highest rated"],
            ["/charts", "Top 10"],
            ["/studios", "Studios"],
            ["/az", "A–Z index"]
          ]}
        />
        <FooterCol
          title="Community"
          links={[
            ["/community", "Board"],
            ["/together", "Watch together"],
            ["/request", "Request"],
            ["/contact", "Contact"]
          ]}
        />
        <FooterCol
          title="About"
          links={[
            ["/faq", "FAQ"],
            ["/terms", "Terms"],
            ["/privacy", "Privacy"],
            ["/dmca", "DMCA"]
          ]}
        />
      </div>

      {genres.length ? (
        <div className="page-shell border-t border-line py-6">
          <button
            type="button"
            onClick={() => setOpenGenres((value) => !value)}
            className="flex w-full items-center justify-between text-sm font-semibold tracking-wide uppercase"
          >
            Browse all genres
            <span className="text-lg text-muted">{openGenres ? "–" : "+"}</span>
          </button>
          {openGenres ? (
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 lg:grid-cols-6">
              {genres.map((genre) => (
                <Link key={genre.slug} href={`/browse?genre=${genre.slug}`} className="text-sm text-muted hover:text-ink">
                  {genre.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="page-shell border-t border-line py-6 text-xs text-muted">
        © {new Date().getFullYear()} Anemi. Catalog for owned or licensed video.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="section-kicker">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {links.map(([href, label]) => (
          <li key={href}>
            {href.startsWith("/feed/") ? (
              <a href={href} className="hover:text-ink">
                {label}
              </a>
            ) : (
              <Link href={href} className="hover:text-ink">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
