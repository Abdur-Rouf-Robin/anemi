import { redirect } from "next/navigation";

import { getRandomTitle } from "@/lib/api";

export default async function RandomPage() {
  const title = await getRandomTitle();
  redirect(title ? `/title/${title.slug}` : "/browse");
}
