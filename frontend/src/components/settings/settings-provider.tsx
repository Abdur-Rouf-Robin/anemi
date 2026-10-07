"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useSession } from "@/components/session-provider";
import { applyAppearance } from "@/lib/user-settings";
import { api } from "@/lib/client-api";
import { defaultPrefs, mergePrefs, prefsPutBody, readLocalPrefs, setActivePrefsUser, writeLocalPrefs } from "@/lib/prefs";
import type { Preferences } from "@/lib/types";

export type SettingsTab =
  | "account"
  | "profile"
  | "privacy"
  | "appearance"
  | "site"
  | "player"
  | "subtitles"
  | "notifications"
  | "integrations"
  | "sessions"
  | "passkeys";

type SettingsCtx = {
  open: boolean;
  tab: SettingsTab;
  query: string;
  prefs: Preferences;
  note: string;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  setTab: (tab: SettingsTab) => void;
  setQuery: (query: string) => void;
  save: (patch: Partial<Preferences>) => Promise<void>;
};

const SettingsContext = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SettingsTab>("account");
  const [query, setQuery] = useState("");
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const [note, setNote] = useState("");

  useEffect(() => {
    function onPrefs() {
      const next = readLocalPrefs();
      setPrefs(next);
      applyAppearance(next);
    }
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<SettingsTab | undefined>).detail;
      setOpen(true);
      if (detail) setTab(detail);
    }
    const frame = window.requestAnimationFrame(onPrefs);
    window.addEventListener("anemi-prefs", onPrefs);
    window.addEventListener("anemi-open-settings", onOpen);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("anemi-prefs", onPrefs);
      window.removeEventListener("anemi-open-settings", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setActivePrefsUser(null);
      const local = readLocalPrefs();
      setPrefs(local);
      applyAppearance(local);
      return;
    }
    setActivePrefsUser(user.id);
    let gone = false;
    api<Preferences & { settings?: unknown }>("/preferences/me")
      .then((remote) => {
        if (gone) return;
        const account = mergePrefs(defaultPrefs, remote);
        setPrefs(account);
        writeLocalPrefs(account);
        applyAppearance(account);
        document.documentElement.classList.toggle("light", account.theme === "light");
        document.documentElement.style.colorScheme = account.theme === "light" ? "light" : "dark";
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [user]);

  const openSettings = useCallback((next?: SettingsTab) => {
    setQuery("");
    if (next) setTab(next);
    setOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const save = useCallback(
    async (patch: Partial<Preferences>) => {
      const merged = mergePrefs(prefs, patch);
      setPrefs(merged);
      writeLocalPrefs(merged);
      applyAppearance(merged);
      document.documentElement.classList.toggle("light", merged.theme === "light");
      document.documentElement.style.colorScheme = merged.theme === "light" ? "light" : "dark";
      document.documentElement.lang = merged.locale === "jp" ? "ja" : "en";
      if (!user) {
        setNote("Saved on this device.");
        return;
      }
      try {
        const updated = await api<Preferences & { settings?: unknown }>("/preferences", {
          method: "PUT",
          body: JSON.stringify(prefsPutBody(merged))
        });
        const next = mergePrefs(merged, updated);
        setPrefs(next);
        writeLocalPrefs(next);
        applyAppearance(next);
        setNote("Saved");
      } catch {
        setNote("Saved on this device.");
      }
    },
    [prefs, user]
  );

  const value = useMemo(
    () => ({ open, tab, query, prefs, note, openSettings, closeSettings, setTab, setQuery, save }),
    [open, tab, query, prefs, note, openSettings, closeSettings, save]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export function usePrefs() {
  const ctx = useContext(SettingsContext);
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  useEffect(() => {
    if (ctx) return;
    const sync = () => setPrefs(readLocalPrefs());
    const frame = window.requestAnimationFrame(sync);
    window.addEventListener("anemi-prefs", sync);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("anemi-prefs", sync);
    };
  }, [ctx]);
  return ctx?.prefs ?? prefs;
}
