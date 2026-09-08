"use client";

import { useEffect } from "react";

import { applyAppearance } from "@/lib/user-settings";
import { readLocalPrefs, writeLocalPrefs } from "@/lib/prefs";

function applyTheme(theme: string) {
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
}

export function ThemeProvider() {
  useEffect(() => {
    function sync() {
      const local = readLocalPrefs();
      applyTheme(local.theme);
      applyAppearance(local);
      document.documentElement.lang = local.locale === "jp" ? "ja" : "en";
    }
    sync();
    window.addEventListener("anemi-prefs", sync);
    return () => window.removeEventListener("anemi-prefs", sync);
  }, []);
  return null;
}

export function setTheme(theme: "dark" | "light") {
  writeLocalPrefs({ ...readLocalPrefs(), theme });
  applyTheme(theme);
  applyAppearance(readLocalPrefs());
}
