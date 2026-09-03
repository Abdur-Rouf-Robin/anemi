"use client";

import { useEffect, useState } from "react";

import { t, type Locale } from "@/lib/i18n";
import { readLocalPrefs } from "@/lib/prefs";

export function useLocale(initial: Locale = "en") {
  const [locale, setLocale] = useState<Locale>(initial);
  useEffect(() => {
    const sync = () => setLocale(readLocalPrefs().locale === "jp" ? "jp" : "en");
    sync();
    window.addEventListener("anemi-locale", sync);
    return () => window.removeEventListener("anemi-locale", sync);
  }, []);
  return locale;
}

export function useT(initial: Locale = "en") {
  const locale = useLocale(initial);
  return (key: string) => t(locale, key);
}
