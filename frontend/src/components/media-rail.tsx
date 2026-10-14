import type { TitleCard } from "@/lib/types";
import { t } from "@/lib/i18n";
import { requestLocale } from "@/lib/request-locale";
import { uniqueById } from "@/lib/utils";

import { PosterCard } from "./poster-card";
import { SectionHead } from "./section-head";

export async function MediaRail({
  title,
  blurb,
  items,
  href,
  showAirDate,
  flush
}: {
  title: string;
  blurb?: string;
  items: TitleCard[];
  href?: string;
  showAirDate?: boolean;
  flush?: boolean;
}) {
  const locale = await requestLocale();
  const cards = uniqueById(items);
  if (!cards.length) return null;
  const shell = flush ? "" : "page-shell";
  return (
    <section className="space-y-4">
      <div className={shell || undefined}>
        <div>
          <SectionHead title={t(locale, title)} href={href} hrefLabel={t(locale, "Show all")} />
          {blurb ? <p className="-mt-3 text-sm text-muted">{t(locale, blurb)}</p> : null}
        </div>
      </div>
      <div className={`${shell} no-scrollbar flex gap-4 overflow-x-auto pb-2`.trim()}>
        {cards.map((item, index) => (
          <PosterCard
            key={`${item.id}-${item.continueEpisodeId ?? index}`}
            title={item}
            showAirDate={showAirDate}
          />
        ))}
      </div>
    </section>
  );
}
