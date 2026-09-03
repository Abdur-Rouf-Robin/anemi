"use client";

import { useRouter } from "next/navigation";

import { api } from "@/lib/client-api";

export function WatchTogetherButton({ episodeId }: { episodeId: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="rounded-full bg-elevated px-4 py-1.5 text-sm ring-1 ring-white/10"
      onClick={() => {
        void api<{ code: string }>("/together", {
          method: "POST",
          body: JSON.stringify({ episodeId })
        })
          .then((room) => router.push(`/together/${room.code}`))
          .catch(() => router.push("/account"));
      }}
    >
      Watch together
    </button>
  );
}
