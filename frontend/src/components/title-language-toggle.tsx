"use client";

import { Languages } from "lucide-react";

import { useSettings } from "@/components/settings/settings-provider";

export function TitleLanguageToggle() {
  const { prefs, save } = useSettings();
  const english = prefs.titleLanguage !== "romaji";

  return (
    <button
      type="button"
      className="filter-btn"
      onClick={() => void save({ titleLanguage: english ? "romaji" : "english" })}
      title={english ? "Switch to Romaji titles" : "Switch to English titles"}
    >
      <Languages className="size-4" />
      <span className="hidden sm:inline">{english ? "English" : "Romaji"}</span>
    </button>
  );
}
