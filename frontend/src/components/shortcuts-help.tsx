"use client";

import { useEffect, useState } from "react";

const rows = [
  ["Ctrl / ⌘ K", "Open search"],
  ["?", "This shortcuts list"],
  ["Esc", "Close overlays"],
  ["K / Space", "Play or pause (watch)"],
  ["← / →", "Skip 10 seconds (watch)"],
  ["F", "Fullscreen (watch)"]
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing) return;
      if (event.key === "?" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setOpen(false)}>
      <div className="card-panel w-full max-w-md p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Shortcuts</h2>
          <button type="button" className="text-sm text-muted" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          {rows.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <dt className="rounded-md bg-elevated px-2 py-1 font-mono text-xs ring-1 ring-white/10">{key}</dt>
              <dd className="text-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
