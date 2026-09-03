"use client";

import { useEffect } from "react";

import { api, getMe } from "@/lib/client-api";
import { readLocalPrefs, writeLocalPrefs } from "@/lib/prefs";
import type { Preferences } from "@/lib/types";

function applyTheme(theme: string) {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
}

export function ThemeProvider() {
  useEffect(() => {
    const local = readLocalPrefs();
    applyTheme(local.theme);
    document.documentElement.lang = local.locale === "jp" ? "ja" : "en";
    getMe()
      .then(async ({ user }) => {
        if (!user) return;
        const prefs = await api<Preferences>("/preferences/me");
        writeLocalPrefs({ ...local, ...prefs });
        if (prefs.theme) applyTheme(prefs.theme);
        document.documentElement.lang = prefs.locale === "jp" ? "ja" : "en";
      })
      .catch(() => undefined);
  }, []);
  return null;
}

export function setTheme(theme: "dark" | "light") {
  writeLocalPrefs({ ...readLocalPrefs(), theme });
  applyTheme(theme);
}
