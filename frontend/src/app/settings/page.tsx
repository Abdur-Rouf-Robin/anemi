"use client";

import { useEffect } from "react";

import { PageIntro } from "@/components/page-intro";
import { useSettings, type SettingsTab } from "@/components/settings/settings-provider";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

const TABS: SettingsTab[] = [
  "account",
  "profile",
  "privacy",
  "appearance",
  "site",
  "player",
  "subtitles",
  "notifications",
  "integrations",
  "sessions",
  "passkeys"
];

export default function SettingsPage() {
  const { openSettings } = useSettings();
  const locale = useLocale();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const next = TABS.includes(tab as SettingsTab) ? (tab as SettingsTab) : "player";
    const frame = window.requestAnimationFrame(() => openSettings(next));
    return () => window.cancelAnimationFrame(frame);
  }, [openSettings]);

  return (
    <main className="page-shell max-w-lg py-10 pb-16">
      <PageIntro kicker="Preferences" title={t(locale, "Settings")} blurb="Manage playback, appearance, and account from the settings dialog." />
      <button type="button" onClick={() => openSettings()} className="btn btn-primary mt-6">
        Open settings
      </button>
    </main>
  );
}
