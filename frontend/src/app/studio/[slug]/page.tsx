import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { PosterGrid } from "@/components/poster-card";
import { getStudio } from "@/lib/api";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const studio = await getStudio(slug);
  return { title: studio?.name ?? "Studio" };
}

export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const studio = await getStudio(slug);
  if (!studio) notFound();

  return (
    <main className="page-shell space-y-8 py-8 pb-16">
      <PageIntro
        kicker="Studio"
        title={studio.name}
        blurb={`${studio.items.length} ${studio.items.length === 1 ? "title" : "titles"} from this studio in the catalog.`}
      />
      {studio.items.length ? (
        <PosterGrid items={studio.items} />
      ) : (
        <EmptyState title="No titles" blurb="Nothing published for this studio yet." href="/browse" hrefLabel="Browse catalog" />
      )}
    </main>
  );
}
