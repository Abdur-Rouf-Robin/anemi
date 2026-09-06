"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageIntro } from "@/components/page-intro";
import { useSession } from "@/components/session-provider";
import { api } from "@/lib/client-api";
import { t } from "@/lib/i18n";
import { defaultPrefs, readLocalPrefs, writeLocalPrefs } from "@/lib/prefs";
import { setTheme } from "@/components/theme-provider";
import type { Preferences } from "@/lib/types";

export default function SettingsPage() {
  const { user } = useSession();
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const signedIn = Boolean(user);
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const local = readLocalPrefs();
    setPrefs(local);
    if (user === undefined) return;
    if (!user) {
      setReady(true);
      return;
    }
    api<Preferences>("/preferences/me")
      .then((remote) => {
        setPrefs(remote);
        writeLocalPrefs(remote);
        if (remote.theme) setTheme(remote.theme);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [user]);

  async function save(next: Partial<Preferences>) {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    writeLocalPrefs(merged);
    if (merged.theme) setTheme(merged.theme);
    document.documentElement.lang = merged.locale === "jp" ? "ja" : "en";
    if (!signedIn) {
      setNote(t(merged.locale, "Saved on this device."));
      return;
    }
    try {
      const updated = await api<Preferences>("/preferences", {
        method: "PUT",
        body: JSON.stringify(next)
      });
      setPrefs(updated);
      writeLocalPrefs(updated);
      setNote(t(updated.locale, "Saved"));
    } catch {
      setNote(t(merged.locale, "Saved on this device."));
    }
  }

  if (!ready) {
    return (
      <main className="page-shell max-w-lg py-10 pb-16">
        <PageIntro kicker="Playback" title={t(prefs.locale, "Settings")} />
      </main>
    );
  }

  return (
    <main className="page-shell max-w-lg space-y-6 py-10 pb-16">
      <PageIntro kicker="Playback" title={t(prefs.locale, "Settings")} />
      {!signedIn ? (
        <p className="text-sm text-muted">
          {t(prefs.locale, "Sign in to save settings across devices.")}{" "}
          <Link href="/account" className="text-accent">
            Account
          </Link>
        </p>
      ) : null}
      <section className="card-panel p-4">
        <h2 className="font-medium">{t(prefs.locale, "Playback")}</h2>
        {(
          [
            ["autoPlay", "Auto play"],
            ["autoNext", "Auto next"],
            ["autoSkipIntro", "Auto skip intro"]
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="mt-3 flex items-center justify-between text-sm">
            {t(prefs.locale, label)}
            <input
              type="checkbox"
              checked={Boolean(prefs[key])}
              onChange={(event) => void save({ [key]: event.target.checked })}
            />
          </label>
        ))}
      </section>
      <section className="card-panel p-4">
        <h2 className="font-medium">{t(prefs.locale, "Appearance")}</h2>
        <div className="mt-3 flex gap-2">
          {(["dark", "light"] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => void save({ theme })}
              className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-white/10 ${
                prefs.theme === theme ? "chip-on" : "bg-elevated text-muted"
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {(["en", "jp"] as const).map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => void save({ locale })}
              className={`rounded-full px-4 py-1.5 text-sm ring-1 ring-white/10 ${
                prefs.locale === locale ? "chip-on" : "bg-elevated text-muted"
              }`}
            >
              {locale === "jp" ? "日本語" : "English"}
            </button>
          ))}
        </div>
      </section>
      {note ? <p className="text-sm text-muted">{note}</p> : null}
    </main>
  );
}
