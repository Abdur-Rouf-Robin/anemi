"use client";

import { useEffect } from "react";

import { readLocalPrefs } from "@/lib/prefs";
import type { Locale } from "@/lib/i18n";

export function LocaleProvider({ initial }: { initial: Locale }) {
  useEffect(() => {
    const prefs = readLocalPrefs();
    const locale = prefs.locale === "jp" || initial === "jp" ? "jp" : "en";
    document.documentElement.lang = locale === "jp" ? "ja" : "en";
  }, [initial]);
  return null;
}
