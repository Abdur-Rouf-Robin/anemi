"use client";

import { api } from "@/lib/client-api";
import { prefsPutBody, readLocalPrefs, writeLocalPrefs } from "@/lib/prefs";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

export function LocaleSwitch({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();

  function setLocale(nextLocale: "en" | "jp") {
    const next = { ...readLocalPrefs(), locale: nextLocale };
    writeLocalPrefs(next);
    void api("/preferences", { method: "PUT", body: JSON.stringify(prefsPutBody(next, { locale: nextLocale })) }).catch(() => undefined);
  }

  return (
    <div className={cn("flex items-center rounded-full bg-elevated/70 p-0.5 text-[11px] font-semibold", compact && "text-[10px]")}>
      {(["en", "jp"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          className={cn(
            "rounded-full px-2 py-1 uppercase",
            locale === item ? "bg-canvas text-ink shadow-sm" : "text-muted hover:text-ink"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
