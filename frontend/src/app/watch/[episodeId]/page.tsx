import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WatchDesk } from "@/components/watch-desk";
import { getEpisode, getProgress, getRelated } from "@/lib/api";

export async function generateMetadata({
  params
}: {
  params: Promise<{ episodeId: string }>;
}): Promise<Metadata> {
  const { episodeId } = await params;
  const data = await getEpisode(episodeId);
  if (!data) return { title: "Watch" };
  return { title: `${data.title.name} · ${data.episode.name}` };
}

export default async function WatchPage({
  params
}: {
  params: Promise<{ episodeId: string }>;
}) {
  const { episodeId } = await params;
  const data = await getEpisode(episodeId);
  if (!data) notFound();
  const [progress, related] = await Promise.all([
    getProgress(data.episode.id),
    data.title.slug ? getRelated(data.title.slug) : Promise.resolve([])
  ]);

  return (
    <WatchDesk
      initial={data}
      initialProgress={progress?.positionSec ?? 0}
      initialRelated={related}
    />
  );
}
