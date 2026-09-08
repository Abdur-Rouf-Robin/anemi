"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client-api";

type ImportResult = { imported: number; unmatched?: string[] };

const ANILIST_STATUS: Record<string, string> = {
  CURRENT: "WATCHING",
  REPEATING: "WATCHING",
  WATCHING: "WATCHING",
  PLANNING: "PLAN_TO_WATCH",
  PLAN_TO_WATCH: "PLAN_TO_WATCH",
  PAUSED: "ON_HOLD",
  ON_HOLD: "ON_HOLD",
  DROPPED: "DROPPED",
  COMPLETED: "COMPLETED"
};

function scoreFromAniList(score?: number) {
  if (!score || score <= 0) return undefined;
  const scaled = score > 10 ? Math.round(score / 10) : Math.round(score);
  return scaled >= 1 && scaled <= 10 ? scaled : undefined;
}

function entriesFromUnknown(parsed: unknown): { name?: string; slug?: string; status: string; score?: number }[] {
  if (!parsed || typeof parsed !== "object") return [];
  const root = parsed as {
    entries?: { name?: string; slug?: string; status?: string; score?: number }[];
    lists?: {
      entries?: {
        status?: string;
        score?: number;
        media?: { title?: { english?: string; romaji?: string; native?: string } };
      }[];
    }[];
  };
  if (Array.isArray(root.entries)) {
    return root.entries.filter((row) => row.status) as { name?: string; slug?: string; status: string; score?: number }[];
  }
  const entries: { name?: string; slug?: string; status: string; score?: number }[] = [];
  for (const list of root.lists ?? []) {
    for (const row of list.entries ?? []) {
      const status = ANILIST_STATUS[(row.status ?? "").toUpperCase().replace(/[\s-]+/g, "_")];
      const name = row.media?.title?.english || row.media?.title?.romaji || row.media?.title?.native;
      if (!status || !name) continue;
      entries.push({ name, status, score: scoreFromAniList(row.score) });
    }
  }
  return entries;
}

export function LibraryTools() {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  async function exportList() {
    const data = await api<unknown>("/library/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "anemi-library.json";
    link.click();
    URL.revokeObjectURL(href);
  }

  function showResult(result: ImportResult) {
    const extra = result.unmatched?.length
      ? ` ${result.unmatched.length} not in this catalog.`
      : "";
    setNote(`Imported ${result.imported}.${extra}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void exportList()} className="filter-btn">
          Export
        </button>
        <label className="filter-btn cursor-pointer">
          Import file
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void file.text().then((text) => {
                const parsed = JSON.parse(text) as unknown;
                const entries = entriesFromUnknown(parsed);
                return api<ImportResult>("/library/import", {
                  method: "PUT",
                  body: JSON.stringify({ entries })
                }).then(showResult);
              }).catch((err: Error) => setNote(err.message));
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const username = String(new FormData(event.currentTarget).get("username") ?? "").trim();
          if (!username) return;
          setPending(true);
          setNote("");
          void api<ImportResult>("/library/import/anilist", {
            method: "PUT",
            body: JSON.stringify({ username })
          })
            .then(showResult)
            .catch((err: Error) => setNote(err.message))
            .finally(() => setPending(false));
        }}
      >
        <input
          name="username"
          required
          placeholder="AniList username"
          className="field-input h-9 w-40"
        />
        <button type="submit" disabled={pending} className="hero-cta h-9 px-4 text-sm font-semibold disabled:opacity-60">
          {pending ? "Importing…" : "Import AniList"}
        </button>
      </form>
      {note ? <p className="max-w-sm text-right text-xs text-muted">{note}</p> : null}
    </div>
  );
}
