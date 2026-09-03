"use client";

import { api } from "@/lib/client-api";
import { readLocalPrefs, writeLocalPrefs } from "@/lib/prefs";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

export function LocaleSwitch({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();

  function setLocale(next: "en" | "jp") {
    writeLocalPrefs({ ...readLocalPrefs(), locale: next });
    void api("/preferences", { method: "PUT", body: JSON.stringify({ locale: next }) }).catch(() => undefined);
  }

  return (
    <div className={cn("flex items-center gap-0.5 text-xs font-semibold", compact && "text-[11px]")}>
      {(["en", "jp"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          className={cn(
            "rounded-md px-1.5 py-0.5 uppercase",
            locale === item ? "text-accent underline decoration-2 underline-offset-4" : "text-muted hover:text-ink"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
