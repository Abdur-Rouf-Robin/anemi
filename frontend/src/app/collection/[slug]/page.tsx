import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { PosterGrid } from "@/components/poster-card";
import { getCollection } from "@/lib/api";
import { absoluteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shelf = await getCollection(slug);
  if (!shelf) return { title: "Collection" };
  return {
    title: shelf.name,
    description: `Staff collection: ${shelf.name}`,
    openGraph: {
      title: shelf.name,
      url: absoluteUrl(`/collection/${slug}`)
    }
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shelf = await getCollection(slug);
  if (!shelf) notFound();

  return (
    <main className="space-y-8 py-8 pb-16">
      <div className="page-shell">
        <PageIntro kicker="Collection" title={shelf.name} blurb="A staff-picked shelf from the catalog." />
      </div>
      <div className="page-shell">
        <PosterGrid items={shelf.items} />
        {!shelf.items.length ? (
          <EmptyState title="Nothing in this collection" blurb="Staff have not published titles here yet." href="/" hrefLabel="Home" />
        ) : null}
      </div>
    </main>
  );
}
