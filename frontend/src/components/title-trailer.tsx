"use client";

import { useState } from "react";

function trailerView(url: string) {
  if (url.startsWith("/")) return { kind: "video" as const, src: url };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const host = parsed.hostname.replace(/^www\./, "");
    const idFromPath = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    const youtubeId =
      host === "youtu.be"
        ? parsed.pathname.slice(1).split("/")[0]
        : host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com"
          ? parsed.searchParams.get("v") || (parsed.pathname.includes("/embed/") || parsed.pathname.includes("/shorts/") ? idFromPath : "")
          : "";
    if (youtubeId && /^[\w-]{6,}$/.test(youtubeId)) {
      return { kind: "youtube" as const, src: `https://www.youtube-nocookie.com/embed/${youtubeId}` };
    }
    return { kind: "video" as const, src: url };
  } catch {
    return null;
  }
}

export function TitleTrailer({ url }: { url: string }) {
  const view = trailerView(url);
  const [open, setOpen] = useState(false);
  if (!view) return null;
  return (
    <div className="mt-4">
      <button type="button" className="btn h-9 px-3 text-sm" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide trailer" : "Watch trailer"}
      </button>
      {open ? (
        <div className="mt-3 overflow-hidden rounded-xl bg-black ring-1 ring-line">
          {view.kind === "youtube" ? (
            <iframe title="Trailer" src={view.src} className="aspect-video w-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <video src={view.src} controls className="aspect-video w-full" />
          )}
        </div>
      ) : null}
    </div>
  );
}
