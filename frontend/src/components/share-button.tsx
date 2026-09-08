"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function ShareButton({ title, url, icon }: { title: string; url?: string; icon?: boolean }) {
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
    <button
      type="button"
      onClick={() => void share()}
      aria-label="Share"
      className={cn(
        icon
          ? "inline-flex h-10 items-center gap-2 rounded-lg bg-elevated px-3 text-sm font-semibold ring-1 ring-line"
          : "rounded-full bg-elevated px-5 py-2 text-sm ring-1 ring-white/10"
      )}
    >
      {icon ? <Share2 className="size-4" /> : null}
      {copied ? "Copied" : "Share"}
    </button>
  );
}
