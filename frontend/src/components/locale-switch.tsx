"use client";

import { useSettings } from "@/components/settings/settings-provider";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

export function LocaleSwitch({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const { save } = useSettings();

  function setLocale(nextLocale: "en" | "jp") {
    void save({ locale: nextLocale });
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
