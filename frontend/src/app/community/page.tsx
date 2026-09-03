import type { Metadata } from "next";

import { CommunityBoard } from "./board";
import { PageIntro } from "@/components/page-intro";
import { getCommunityPosts } from "@/lib/api";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const posts = await getCommunityPosts(category);

  return (
    <main className="page-shell max-w-3xl py-8 pb-16">
      <PageIntro
        kicker="Board"
        title="Community"
        blurb="Updates, questions, and suggestions about this catalog."
      />
      <CommunityBoard posts={posts} category={category} />
    </main>
  );
}
