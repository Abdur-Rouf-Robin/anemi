"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageIntro } from "@/components/page-intro";
import { api } from "@/lib/client-api";
import type { TitleCard, TitleDetail } from "@/lib/types";
import { audioTrackLabel } from "@/lib/utils";

export default function TogetherPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<TitleCard[]>([]);
  const [detail, setDetail] = useState<TitleDetail | null>(null);
  const [episodeId, setEpisodeId] = useState("");

  const episodes = useMemo(() => {
    return (detail?.seasons ?? []).flatMap((season) =>
      season.episodes
        .filter((episode) => episode.videoUrl)
        .map((episode) => ({
          id: episode.id,
          label: `S${season.number} E${episode.number} · ${audioTrackLabel(episode.audioKind, episode.language)} · ${episode.name}`
        }))
    );
  }, [detail]);

  function search(value: string) {
    setQ(value);
    if (value.trim().length < 1) {
      setHits([]);
      return;
    }
    void api<{ items: TitleCard[] }>(`/catalog/titles?q=${encodeURIComponent(value)}&take=8`)
      .then((data) => setHits(data.items))
      .catch(() => setHits([]));
  }

  function pickTitle(slug: string) {
    setHits([]);
    setEpisodeId("");
    void api<TitleDetail>(`/catalog/titles/${slug}`)
      .then((title) => {
        setDetail(title);
        const first = title.seasons.flatMap((season) => season.episodes).find((episode) => episode.videoUrl);
        if (first) setEpisodeId(first.id);
      })
      .catch((err: Error) => setError(err.message));
  }

  return (
    <main className="page-shell max-w-lg py-10 pb-16">
      <PageIntro
        kicker="Rooms"
        title="Watch together"
        blurb="Pick a published episode, share the room link, and guests follow your playhead. Chat stays in the room."
      />
      <div className="card-panel relative mt-6 space-y-4 p-4">
        <input
          value={q}
          onChange={(event) => search(event.target.value)}
          placeholder="Search a title"
          className="field-input"
        />
        {hits.length ? (
          <ul className="card-panel absolute top-16 z-10 w-[calc(100%-2rem)] overflow-hidden py-1">
            {hits.map((title) => (
              <li key={title.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-elevated"
                  onClick={() => {
                    setQ(title.name);
                    pickTitle(title.slug);
                  }}
                >
                  {title.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      {detail ? (
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Episode</span>
          <select
            value={episodeId}
            onChange={(event) => setEpisodeId(event.target.value)}
            className="field-input"
          >
            {!episodes.length ? <option value="">No playable episodes</option> : null}
            {episodes.map((episode) => (
              <option key={episode.id} value={episode.id}>
                {episode.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!episodeId) {
            setError("Pick an episode first");
            return;
          }
          void api<{ code: string }>("/together", {
            method: "POST",
            body: JSON.stringify({ episodeId })
          })
            .then((room) => router.push(`/together/${room.code}`))
            .catch((err: Error) => setError(err.message));
        }}
      >
        <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink" disabled={!episodeId}>
          Create room
        </button>
      </form>
      </div>
      <form
        className="card-panel mt-4 flex gap-2 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
          if (code) router.push(`/together/${code}`);
        }}
      >
        <input name="code" required placeholder="Join with a code" className="field-input flex-1" />
        <button type="submit" className="rounded-full bg-elevated px-4 text-sm ring-1 ring-white/10">
          Join
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </main>
  );
}
