"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminHeader,
  AdminNotice,
  Field,
  adminControl
} from "@/components/admin/ui";
import { api, uploadFile, uploadFiles } from "@/lib/client-api";
import { toDatetimeLocal } from "@/lib/utils";

import { InboxImport } from "./inbox-import";

function formAirDate(form: FormData) {
  const raw = String(form.get("airDate") ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

type Episode = {
  id: string;
  number: number;
  name: string;
  videoUrl: string | null;
  durationSec: number | null;
  introStartSec?: number | null;
  introEndSec: number | null;
  encodeStatus: string;
  encodeError: string | null;
  audioKind?: "SUB" | "DUB";
  language?: string;
  airDate?: string | null;
  subtitleUrl?: string | null;
  captions?: { id: string; language: string; url: string }[];
  outroStartSec?: number | null;
  publish?: string;
  kind?: string;
};

type Season = { id: string; number: number; episodes: Episode[] };

type AdminTitle = {
  id: string;
  name: string;
  nameJa?: string | null;
  slug: string;
  type: "SERIES" | "MOVIE" | "OVA" | "ONA" | "SPECIAL";
  status: "UPCOMING" | "AIRING" | "COMPLETED";
  synopsis: string;
  year: number | null;
  hue: number;
  spotlight: boolean;
  studio?: string | null;
  ageRating?: string | null;
  airSeason?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  publish: string;
  genres: { slug: string; name: string }[];
  seasons: Season[];
};

function Step({ n, label, hint }: { n: number; label: string; hint: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] tracking-wide text-muted uppercase">Step {n}</p>
      <p className="font-medium">{label}</p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

export default function AdminTitleEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState<AdminTitle | null>(null);
  const [genres, setGenres] = useState<{ slug: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [packing, setPacking] = useState<string | null>(null);
  const [publishingSeason, setPublishingSeason] = useState<string | null>(null);

  function readyToPublish(episode: Episode) {
    if (episode.publish === "PUBLISHED") return false;
    if (!episode.videoUrl) return false;
    return episode.encodeStatus === "ready" || episode.encodeStatus === "idle";
  }

  async function load() {
    const [next, list] = await Promise.all([
      api<AdminTitle>(`/admin/titles/${params.id}`),
      api<{ slug: string; name: string }[]>("/catalog/genres")
    ]);
    setTitle(next);
    setGenres(list);
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [params.id]);

  async function saveTitle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title) return;
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api(`/admin/titles/${title.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.get("name"),
          nameJa: String(form.get("nameJa") ?? "").trim() || undefined,
          slug: form.get("slug"),
          type: form.get("type"),
          status: form.get("status"),
          synopsis: form.get("synopsis"),
          year: Number(form.get("year")),
          hue: Number(form.get("hue")),
          spotlight: form.get("spotlight") === "on",
          studio: form.get("studio") || undefined,
          ageRating: form.get("ageRating") || undefined,
          airSeason: form.get("airSeason") || undefined,
          posterUrl: form.get("posterUrl") || undefined,
          backdropUrl: form.get("backdropUrl") || undefined,
          genreSlugs: form.getAll("genre").map(String)
        })
      });
      setNote("Title saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save title");
    }
  }

  async function setPublish(action: "publish" | "unlist") {
    if (!title) return;
    try {
      await api(`/admin/titles/${title.id}/${action}`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change publish");
    }
  }

  async function addSeason() {
    if (!title) return;
    try {
      await api(`/admin/titles/${title.id}/seasons`, { method: "POST" });
      setNote("Season added.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add season");
    }
  }

  async function publishSeasonReady(seasonId: string) {
    setError("");
    setPublishingSeason(seasonId);
    try {
      const result = await api<{ published: number; skipped: number }>(`/admin/seasons/${seasonId}/publish-ready`, {
        method: "POST"
      });
      setNote(
        `Published ${result.published} ready episode${result.published === 1 ? "" : "s"}.` +
          (result.skipped ? ` Left ${result.skipped} draft (no file or still encoding).` : "")
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish season");
    } finally {
      setPublishingSeason(null);
    }
  }

  async function addEpisode(seasonId: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title) return;
    setError("");
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      await api(`/admin/titles/${title.id}/episodes`, {
        method: "POST",
        body: JSON.stringify({
          seasonId,
          name: form.get("name"),
          videoUrl: form.get("videoUrl") || undefined,
          durationSec: form.get("durationSec") ? Number(form.get("durationSec")) : undefined,
          audioKind: form.get("audioKind") || "SUB",
          language: String(form.get("language") ?? "").trim() || undefined,
          airDate: formAirDate(form),
          number: form.get("number") ? Number(form.get("number")) : undefined,
          kind: form.get("kind") || "CANON"
        })
      });
      formEl.reset();
      setNote("Episode added. Upload a video on that episode next.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add episode");
    }
  }

  async function saveEpisode(episode: Episode, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api(`/admin/episodes/${episode.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.get("name"),
          number: form.get("number") ? Number(form.get("number")) : undefined,
          videoUrl: form.get("videoUrl") || undefined,
          durationSec: form.get("durationSec") ? Number(form.get("durationSec")) : undefined,
          introStartSec: form.get("introStartSec") ? Number(form.get("introStartSec")) : undefined,
          introEndSec: form.get("introEndSec") ? Number(form.get("introEndSec")) : undefined,
          outroStartSec: form.get("outroStartSec") ? Number(form.get("outroStartSec")) : undefined,
          subtitleUrl: form.get("subtitleUrl") || undefined,
          audioKind: form.get("audioKind") || "SUB",
          language: String(form.get("language") ?? "").trim(),
          airDate: formAirDate(form),
          publish: form.get("publish") || undefined,
          kind: form.get("kind") || "CANON"
        })
      });
      setNote("Episode saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save episode");
    }
  }

  async function uploadEpisode(episodeId: string, file: File) {
    setError("");
    try {
      await uploadFile(`/admin/episodes/${episodeId}/upload`, file);
      setNote("Video uploaded. Wait for encode if ffmpeg is installed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function uploadPack(seasonId: string, files: FileList | null) {
    if (!title || !files?.length) return;
    setError("");
    setPacking(seasonId);
    try {
      const result = await uploadFiles<{
        queued: number;
        created: number;
        updated: number;
        skipped: number;
        results: { name: string; status: string; reason?: string }[];
      }>(`/admin/titles/${title.id}/pack?seasonId=${encodeURIComponent(seasonId)}`, Array.from(files));
      const misses = result.results
        .filter((row) => row.status === "skipped")
        .map((row) => `${row.name}${row.reason ? ` (${row.reason})` : ""}`);
      setNote(
        `Pack queued ${result.queued} (${result.created} new, ${result.updated} updated)` +
          (misses.length ? `. Skipped: ${misses.join("; ")}` : ".")
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pack upload failed");
    } finally {
      setPacking(null);
    }
  }

  async function removeSeason(id: string) {
    if (!confirm("Delete this season and all of its episodes?")) return;
    await api(`/admin/seasons/${id}`, { method: "DELETE" });
    await load();
  }

  async function removeEpisode(id: string) {
    if (!confirm("Delete this episode?")) return;
    await api(`/admin/episodes/${id}`, { method: "DELETE" });
    await load();
  }

  async function removeTitle() {
    if (!title || !confirm("Delete this title and its episodes?")) return;
    await api(`/admin/titles/${title.id}`, { method: "DELETE" });
    router.push("/admin/titles");
  }

  if (error && !title) return <AdminNotice>{error}</AdminNotice>;
  if (!title) return <p className="text-sm text-muted">Loading…</p>;
  const selected = new Set(title.genres.map((genre) => genre.slug));
  const isMovie = title.type === "MOVIE";

  return (
    <main className="space-y-8">
      <datalist id="audio-langs">
        {["Original", "Japanese", "English", "Spanish", "French", "German", "Portuguese", "Italian", "Korean", "Chinese", "Hindi"].map(
          (item) => (
            <option key={item} value={item} />
          )
        )}
      </datalist>
      <datalist id="caption-langs">
        {["English", "Spanish", "French", "German", "Portuguese", "Italian", "Japanese", "Korean", "Chinese", "Arabic"].map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
      <AdminHeader
        title={title.name}
        description="One show. Seasons hold episodes. Each episode is one video file. Extra Sub or Dub languages are more files with the same episode number. Captions are .vtt files on that video."
        action={<AdminBadge tone={title.publish === "PUBLISHED" ? "ok" : "muted"}>{title.publish}</AdminBadge>}
      />
      <p>
        <Link href="/admin/titles" className="text-sm text-muted hover:text-ink">
          ← All titles
        </Link>
        <span className="text-muted"> · </span>
        <Link href="/admin/home" className="text-sm text-muted hover:text-ink">
          Homepage
        </Link>
        <span className="text-muted"> · </span>
        <Link href="/admin/schedule" className="text-sm text-muted hover:text-ink">
          Schedule
        </Link>
      </p>
      {error ? <AdminNotice>{error}</AdminNotice> : null}
      {note ? <AdminNotice tone="ok">{note}</AdminNotice> : null}

      <AdminCard className="grid gap-4 sm:grid-cols-4">
        <Step n={1} label="Title" hint="The show people browse (RobinHood)." />
        <Step n={2} label="Season" hint={isMovie ? "A movie still uses one season as a folder." : "S1, S2… A folder of episodes."} />
        <Step n={3} label="Episode" hint="One video. Sub and Dub are two files with the same number." />
        <Step n={4} label="Files" hint="Upload video (and optional .vtt captions) on the episode." />
      </AdminCard>

      <section>
        <h2 className="mb-3 text-lg font-semibold">1 · Title</h2>
        <form onSubmit={(event) => void saveTitle(event)}>
          <AdminCard>
            <div className="mb-5 flex flex-wrap items-start gap-6">
              <div>
                {title.posterUrl ? (
                  <img src={title.posterUrl} alt="" className="poster-frame h-28 w-[4.6rem] object-cover" />
                ) : (
                  <div className="poster-frame flex h-28 w-[4.6rem] items-center justify-center bg-elevated text-xs text-muted">
                    Art
                  </div>
                )}
                <p className="mt-2 text-sm font-medium">Poster</p>
                <label className="mt-1 inline-flex cursor-pointer text-sm text-accent">
                  Upload
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file || !title) return;
                      void uploadFile(`/admin/titles/${title.id}/poster`, file)
                        .then(() => {
                          setNote("Poster uploaded.");
                          return load();
                        })
                        .catch((err: Error) => setError(err.message));
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
              <div>
                {title.backdropUrl ? (
                  <img src={title.backdropUrl} alt="" className="poster-frame h-20 w-36 object-cover" />
                ) : (
                  <div className="poster-frame flex h-20 w-36 items-center justify-center bg-elevated text-xs text-muted">
                    Wide
                  </div>
                )}
                <p className="mt-2 text-sm font-medium">Backdrop</p>
                <label className="mt-1 inline-flex cursor-pointer text-sm text-accent">
                  Upload
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file || !title) return;
                      void uploadFile(`/admin/titles/${title.id}/backdrop`, file)
                        .then(() => {
                          setNote("Backdrop uploaded.");
                          return load();
                        })
                        .catch((err: Error) => setError(err.message));
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <input name="name" defaultValue={title.name} className={adminControl} />
              </Field>
              <Field label="Japanese name">
                <input name="nameJa" defaultValue={title.nameJa ?? ""} placeholder="日本語タイトル" className={adminControl} />
              </Field>
              <Field label="Slug (URL)">
                <input name="slug" defaultValue={title.slug} className={adminControl} />
              </Field>
              <Field label="Type">
                <select name="type" defaultValue={title.type} className={adminControl}>
                  <option value="SERIES">Series (many episodes)</option>
                  <option value="MOVIE">Movie (one episode in one season)</option>
                  <option value="OVA">OVA</option>
                  <option value="ONA">ONA</option>
                  <option value="SPECIAL">Special</option>
                </select>
              </Field>
              <Field label="Catalog status">
                <select name="status" defaultValue={title.status} className={adminControl}>
                  <option value="UPCOMING">Upcoming (Coming soon / Airing soon)</option>
                  <option value="AIRING">Airing (Airing now + schedule)</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </Field>
              <Field label="Year">
                <input name="year" type="number" defaultValue={title.year ?? ""} className={adminControl} />
              </Field>
              <Field label="Studio">
                <input name="studio" defaultValue={title.studio ?? ""} className={adminControl} />
              </Field>
              <Field label="Age rating">
                <input name="ageRating" defaultValue={title.ageRating ?? ""} className={adminControl} />
              </Field>
              <Field label="Air season">
                <select name="airSeason" defaultValue={title.airSeason ?? ""} className={adminControl}>
                  <option value="">None</option>
                  <option value="WINTER">Winter</option>
                  <option value="SPRING">Spring</option>
                  <option value="SUMMER">Summer</option>
                  <option value="FALL">Fall</option>
                </select>
              </Field>
              <p className="text-xs text-muted md:col-span-2">
                Air season feeds Discover. Upcoming/Airing titles without episode air times show up on the Schedule desk.
              </p>
              <Field label="Poster URL">
                <input name="posterUrl" defaultValue={title.posterUrl ?? ""} className={adminControl} />
              </Field>
              <Field label="Backdrop URL">
                <input name="backdropUrl" defaultValue={title.backdropUrl ?? ""} className={adminControl} />
              </Field>
              <Field label="Hue" className="hidden">
                <input name="hue" type="number" defaultValue={title.hue} className={adminControl} />
              </Field>
              <Field label="Synopsis" className="md:col-span-2">
                <textarea name="synopsis" defaultValue={title.synopsis} className="field-input min-h-28 py-2" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-muted md:col-span-2">
                <input type="checkbox" name="spotlight" defaultChecked={title.spotlight} />
                Spotlight on home (used when Homepage hero list is empty)
              </label>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                {genres.map((genre) => (
                  <label key={genre.slug} className="flex items-center gap-1.5 rounded-full bg-elevated px-3 py-1 text-sm text-muted ring-1 ring-white/10">
                    <input type="checkbox" name="genre" value={genre.slug} defaultChecked={selected.has(genre.slug)} />
                    {genre.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <AdminButton type="submit">Save title</AdminButton>
              <AdminButton type="button" variant="secondary" onClick={() => void setPublish("publish")}>
                Publish title
              </AdminButton>
              <AdminButton type="button" variant="ghost" onClick={() => void setPublish("unlist")}>
                Unlist
              </AdminButton>
              <AdminButton type="button" variant="danger" onClick={() => void removeTitle()}>
                Delete title
              </AdminButton>
            </div>
          </AdminCard>
        </form>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">2 · Seasons</h2>
            <p className="text-sm text-muted">
              {isMovie
                ? "Use one season. Put the film file on episode 1 inside it."
                : "Each season is a folder. Add S2 only when you have more episodes."}
            </p>
          </div>
          <AdminButton type="button" variant="secondary" onClick={() => void addSeason()}>
            Add season
          </AdminButton>
        </div>

        {!title.seasons.length ? (
          <AdminCard>
            <p className="text-sm text-muted">No seasons yet. Add season 1, then add an episode inside it.</p>
          </AdminCard>
        ) : null}

        <div className="space-y-6">
          {title.seasons.map((season) => (
            <div key={season.id} className="card-panel p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-medium">Season {season.number}</h3>
                <div className="flex flex-wrap gap-2">
                  <AdminButton
                    type="button"
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    disabled={publishingSeason === season.id || !season.episodes.some(readyToPublish)}
                    onClick={() => void publishSeasonReady(season.id)}
                  >
                    {publishingSeason === season.id
                      ? "Publishing…"
                      : `Publish ready (${season.episodes.filter(readyToPublish).length})`}
                  </AdminButton>
                  <AdminButton type="button" variant="danger" className="h-8 px-3 text-xs" onClick={() => void removeSeason(season.id)}>
                    Delete season
                  </AdminButton>
                </div>
              </div>

              <div className="mb-5 rounded-xl bg-elevated/50 p-4 ring-1 ring-white/8">
                <p className="mb-3 text-sm font-medium">3 · Add episode in season {season.number}</p>
                <form onSubmit={(event) => void addEpisode(season.id, event)} className="grid gap-3 md:grid-cols-4">
                  <Field label="Name" className="md:col-span-2">
                    <input name="name" required placeholder={isMovie ? "The film" : "Episode name"} className={adminControl} />
                  </Field>
                  <Field label="Number">
                    <input name="number" type="number" min={1} placeholder="auto" className={adminControl} />
                  </Field>
                  <Field label="Audio (which voices)">
                    <select name="audioKind" className={adminControl}>
                      <option value="SUB">Sub — original voices, use captions</option>
                      <option value="DUB">Dub — translated spoken audio</option>
                    </select>
                  </Field>
                  <Field label="Language (for extra Sub/Dub files)">
                    <input name="language" placeholder="English, Spanish, Japanese…" list="audio-langs" className={adminControl} />
                  </Field>
                  <Field label="Kind">
                    <select name="kind" className={adminControl}>
                      <option value="CANON">Canon</option>
                      <option value="FILLER">Filler</option>
                      <option value="RECAP">Recap</option>
                    </select>
                  </Field>
                  <p className="text-xs text-muted md:col-span-4">
                    Same episode number + different language creates another option in the player. Example: Dub English, then Dub Spanish. Extra caption languages are .vtt files on each video.
                  </p>
                  <Field label="Video URL (or upload below after creating)" className="md:col-span-2">
                    <input name="videoUrl" placeholder="https://… or /media/…" className={adminControl} />
                  </Field>
                  <Field label="Duration (sec)">
                    <input name="durationSec" type="number" className={adminControl} />
                  </Field>
                  <Field label="Air date & time">
                    <input name="airDate" type="datetime-local" className={adminControl} />
                  </Field>
                  <div className="flex items-end md:col-span-4">
                    <AdminButton type="submit">Add episode here</AdminButton>
                  </div>
                </form>
                <div className="mt-4 border-t border-white/8 pt-4">
                  <p className="mb-2 text-sm font-medium">Or drop a season pack</p>
                  <p className="mb-3 text-xs text-muted">
                    Browser upload is for small files. Prefer rsync into the inbox, then import the folder. Names like S01E03.mp4, 1x02-dub.mkv, Episode 07.mov, or 04.mp4. Creates drafts and queues encode — does not publish.
                  </p>
                  <label className={`inline-flex h-10 cursor-pointer items-center rounded-full bg-elevated px-4 text-sm font-semibold ring-1 ring-white/10 ${packing === season.id ? "opacity-60" : ""}`}>
                    {packing === season.id ? "Uploading pack…" : "Choose videos"}
                    <input
                      type="file"
                      multiple
                      accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.mkv"
                      className="hidden"
                      disabled={packing === season.id}
                      onChange={(event) => {
                        void uploadPack(season.id, event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <InboxImport
                    titleId={title.id}
                    seasonId={season.id}
                    onDone={(note) => {
                      setNote(note);
                      void load();
                    }}
                  />
                </div>
              </div>

              <p className="mb-3 text-sm font-medium">Episodes in this season</p>
              <div className="space-y-4 border-l-2 border-line pl-4">
                {season.episodes.map((episode) => (
                  <AdminCard key={episode.id} className="bg-canvas/40 p-4">
                    <form onSubmit={(event) => void saveEpisode(episode, event)} className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          E{episode.number} · {episode.name}
                        </span>
                        <AdminBadge tone={episode.audioKind === "DUB" ? "accent" : "muted"}>
                          {episode.audioKind === "DUB" ? "Dub" : "Sub"}
                          {episode.language ? ` · ${episode.language}` : ""}
                        </AdminBadge>
                        <AdminBadge tone={episode.publish === "PUBLISHED" ? "ok" : "muted"}>
                          {episode.publish ?? "draft"}
                        </AdminBadge>
                        <span className="text-xs text-muted">Encode: {episode.encodeStatus ?? "idle"}</span>
                        {episode.encodeError ? <span className="text-xs text-amber-300">{episode.encodeError}</span> : null}
                      </div>
                      <div className="grid gap-3 md:grid-cols-4">
                        <Field label="Name" className="md:col-span-2">
                          <input name="name" defaultValue={episode.name} className={adminControl} />
                        </Field>
                        <Field label="Number">
                          <input name="number" type="number" min={1} defaultValue={episode.number} className={adminControl} />
                        </Field>
                        <Field label="Audio (which voices)">
                          <select name="audioKind" defaultValue={episode.audioKind ?? "SUB"} className={adminControl}>
                            <option value="SUB">Sub — original voices, use captions</option>
                            <option value="DUB">Dub — translated spoken audio</option>
                          </select>
                        </Field>
                        <Field label="Language">
                          <input name="language" defaultValue={episode.language ?? ""} placeholder="English, Spanish…" list="audio-langs" className={adminControl} />
                        </Field>
                        <Field label="Kind">
                          <select name="kind" defaultValue={episode.kind ?? "CANON"} className={adminControl}>
                            <option value="CANON">Canon</option>
                            <option value="FILLER">Filler</option>
                            <option value="RECAP">Recap</option>
                          </select>
                        </Field>
                        <Field label="Publish">
                          <select name="publish" defaultValue={episode.publish ?? "PUBLISHED"} className={adminControl}>
                            <option value="PUBLISHED">Published</option>
                            <option value="DRAFT">Draft</option>
                            <option value="UNLISTED">Unlisted</option>
                          </select>
                        </Field>
                        <Field label="Air date & time">
                          <input
                            name="airDate"
                            type="datetime-local"
                            defaultValue={toDatetimeLocal(episode.airDate)}
                            className={adminControl}
                          />
                        </Field>
                        <Field label="Duration (sec)">
                          <input name="durationSec" type="number" defaultValue={episode.durationSec ?? ""} className={adminControl} />
                        </Field>
                        <Field label="Intro start (sec)">
                          <input name="introStartSec" type="number" defaultValue={episode.introStartSec ?? ""} className={adminControl} />
                        </Field>
                        <Field label="Intro end (sec)">
                          <input name="introEndSec" type="number" defaultValue={episode.introEndSec ?? ""} className={adminControl} />
                        </Field>
                        <Field label="Outro start (sec)">
                          <input name="outroStartSec" type="number" defaultValue={episode.outroStartSec ?? ""} className={adminControl} />
                        </Field>
                        <Field label="Video URL" className="md:col-span-2">
                          <input name="videoUrl" defaultValue={episode.videoUrl ?? ""} className={adminControl} />
                        </Field>
                        <Field label="Captions URL" className="md:col-span-2">
                          <input name="subtitleUrl" defaultValue={episode.subtitleUrl ?? ""} className={adminControl} />
                        </Field>
                      </div>
                      <div>
                        <p className="mb-2 text-[11px] font-medium tracking-wide text-muted uppercase">Caption languages on this file</p>
                        <ul className="mb-3 flex flex-wrap gap-2">
                          {(episode.captions ?? []).map((track) => (
                            <li key={track.id} className="flex items-center gap-2 rounded-full bg-elevated px-3 py-1 text-xs ring-1 ring-white/10">
                              {track.language}
                              <button
                                type="button"
                                className="text-muted hover:text-red-400"
                                onClick={() => {
                                  void api(`/admin/captions/${track.id}`, { method: "DELETE" })
                                    .then(() => load())
                                    .catch((err: Error) => setError(err.message));
                                }}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                          {!episode.captions?.length && episode.subtitleUrl ? (
                            <li className="text-xs text-muted">Default captions attached</li>
                          ) : null}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 text-[11px] font-medium tracking-wide text-muted uppercase">4 · Files for this episode</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="cursor-pointer text-sm text-accent">
                            Upload video
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.mkv"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void uploadEpisode(episode.id, file);
                                event.target.value = "";
                              }}
                            />
                          </label>
                          <label className="cursor-pointer text-sm text-accent">
                            Upload captions (.vtt)
                            <input
                              type="file"
                              accept=".vtt,text/vtt"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                const lang =
                                  (event.currentTarget.form?.elements.namedItem("captionLanguage") as HTMLInputElement | null)
                                    ?.value || undefined;
                                if (!file) return;
                                const qs = lang ? `?language=${encodeURIComponent(lang)}` : "";
                                void uploadFile(`/admin/episodes/${episode.id}/captions${qs}`, file)
                                  .then(() => load())
                                  .catch((err: Error) => setError(err.message));
                                event.target.value = "";
                              }}
                            />
                          </label>
                          <input
                            name="captionLanguage"
                            placeholder="Caption language"
                            list="caption-langs"
                            className="h-8 w-36 rounded-lg bg-elevated px-2 text-xs ring-1 ring-white/10"
                          />
                          <AdminButton type="submit" variant="secondary">
                            Save episode
                          </AdminButton>
                          <AdminButton type="button" variant="danger" onClick={() => void removeEpisode(episode.id)}>
                            Delete episode
                          </AdminButton>
                        </div>
                      </div>
                    </form>
                  </AdminCard>
                ))}
                {!season.episodes.length ? (
                  <p className="text-sm text-muted">Empty season. Use the form above to add episode 1 here.</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
