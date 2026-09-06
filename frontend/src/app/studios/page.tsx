import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { getStudios } from "@/lib/api";

export const metadata: Metadata = { title: "Studios" };

export default async function StudiosPage() {
  const studios = await getStudios();

  return (
    <main className="page-shell space-y-8 py-8 pb-16">
      <PageIntro kicker="Catalog" title="Studios" blurb="Every studio with a published title on this site." />
      {studios.length ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {studios.map((studio) => (
            <li key={studio.slug}>
              <Link href={`/studio/${studio.slug}`} className="card-panel flex items-center justify-between px-4 py-3 hover:bg-elevated">
                <span className="font-medium">{studio.name}</span>
                <span className="text-sm text-muted">{studio.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No studios yet" blurb="Set a studio on a title in the CMS." href="/browse" hrefLabel="Browse catalog" />
      )}
    </main>
  );
}
