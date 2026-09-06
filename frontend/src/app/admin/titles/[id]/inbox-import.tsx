"use client";

import { useEffect, useState } from "react";

import { AdminButton } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type Inbox = {
  root: string;
  path: string;
  folders: { name: string; path: string }[];
  files: { name: string; path: string; bytes: number }[];
};

type PackResult = {
  queued: number;
  created: number;
  updated: number;
  skipped: number;
  results: { name: string; status: string; reason?: string }[];
};

function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function InboxImport({
  titleId,
  seasonId,
  onDone
}: {
  titleId: string;
  seasonId: string;
  onDone: (note: string) => void;
}) {
  const [path, setPath] = useState("");
  const [box, setBox] = useState<Inbox | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function load(next = path) {
    setError("");
    void api<Inbox>(`/admin/inbox?path=${encodeURIComponent(next)}`)
      .then((data) => {
        setBox(data);
        setPath(data.path);
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function importFolder() {
    setPending(true);
    setError("");
    try {
      const result = await api<PackResult>(`/admin/titles/${titleId}/inbox`, {
        method: "POST",
        body: JSON.stringify({ path, seasonId })
      });
      const misses = result.results
        .filter((row) => row.status === "skipped")
        .map((row) => `${row.name}${row.reason ? ` (${row.reason})` : ""}`);
      onDone(
        `Inbox imported ${result.queued} (${result.created} new, ${result.updated} updated)` +
          (misses.length ? `. Skipped: ${misses.join("; ")}` : ".")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setPending(false);
    }
  }

  const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";

  return (
    <div className="mt-4 rounded-xl bg-canvas/50 p-3 ring-1 ring-white/8">
      <p className="text-sm font-medium">Import folder already on the server</p>
      <p className="mt-1 text-xs text-muted">
        rsync licensed files into <code className="text-ink">{box?.root ?? "/var/www/anemi/data/inbox"}</code>
        , names like S01E03.mkv, then import. Files stay in the inbox.
      </p>
      {box ? (
        <p className="mt-2 text-xs text-muted">
          inbox/{box.path || "·"}
          {path ? (
            <button type="button" className="ml-2 underline" onClick={() => load(parent)}>
              Up
            </button>
          ) : null}
        </p>
      ) : null}
      <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-sm">
        {(box?.folders ?? []).map((folder) => (
          <li key={folder.path}>
            <button type="button" className="text-left hover:text-accent" onClick={() => load(folder.path)}>
              {folder.name}/
            </button>
          </li>
        ))}
        {(box?.files ?? []).map((file) => (
          <li key={file.path} className="flex justify-between gap-2 text-muted">
            <span className="truncate">{file.name}</span>
            <span className="shrink-0">{sizeLabel(file.bytes)}</span>
          </li>
        ))}
        {box && !box.folders.length && !box.files.length ? <li className="text-muted">Empty folder.</li> : null}
      </ul>
      <AdminButton type="button" className="mt-3" disabled={pending || !box} onClick={() => void importFolder()}>
        {pending ? "Importing…" : "Import this folder"}
      </AdminButton>
      {error ? <p className="mt-2 text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
