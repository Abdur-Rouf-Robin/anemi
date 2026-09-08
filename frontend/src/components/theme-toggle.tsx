"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "@/lib/client-api";
import { setTheme } from "@/components/theme-provider";
import { prefsPutBody, readLocalPrefs } from "@/lib/prefs";

export function ThemeToggle() {
  const [theme, setLocal] = useState<"dark" | "light">("light");

  useEffect(() => {
    setLocal(localStorage.getItem("anemi-theme") === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setLocal(next);
    setTheme(next);
    void api("/preferences", {
      method: "PUT",
      body: JSON.stringify(prefsPutBody(readLocalPrefs(), { theme: next }))
    }).catch(() => undefined);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="icon-btn"
    >
      {theme === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
