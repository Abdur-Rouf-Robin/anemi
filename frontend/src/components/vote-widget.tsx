"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/client-api";

const LABELS = [
  { score: 3, label: "Boring" },
  { score: 7, label: "Great" },
  { score: 10, label: "Amazing" }
];

export function VoteWidget({ slug, score }: { slug: string; score?: number | null }) {
  const router = useRouter();
  const [mine, setMine] = useState<number | null>(null);
  const [avg, setAvg] = useState(score ?? null);

  useEffect(() => {
    api<{ mine: number | null }>(`/catalog/titles/${slug}/rating`)
      .then((data) => setMine(data.mine))
      .catch(() => undefined);
  }, [slug]);

  async function vote(next: number) {
    try {
      const result = await api<{ score: number; mine: number }>(`/catalog/titles/${slug}/rating`, {
        method: "PUT",
        body: JSON.stringify({ score: next })
      });
      setMine(result.mine);
      setAvg(result.score);
    } catch {
      router.push("/account");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-elevated px-3 py-1 text-sm ring-1 ring-white/10">
        {avg != null ? avg.toFixed(1) : "—"}
      </span>
      {LABELS.map((item) => (
        <button
          key={item.score}
          type="button"
          onClick={() => void vote(item.score)}
          className={`rounded-full px-3 py-1 text-xs ring-1 ring-white/10 ${
            mine === item.score ? "chip-on" : "bg-elevated text-muted"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
