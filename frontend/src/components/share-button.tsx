"use client";

import { useState } from "react";

export function ShareButton({ title, url }: { title: string; url?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const href = url ?? window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: href });
        return;
      }
    } catch {
      /* fall through */
    }
    await navigator.clipboard.writeText(href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button type="button" onClick={() => void share()} className="rounded-full bg-elevated px-5 py-2 text-sm ring-1 ring-white/10">
      {copied ? "Copied" : "Share"}
    </button>
  );
}
