"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "@/lib/client-api";
import { setTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const [theme, setLocal] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setLocal(localStorage.getItem("anemi-theme") === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setLocal(next);
    setTheme(next);
    void api("/preferences", { method: "PUT", body: JSON.stringify({ theme: next }) }).catch(() => undefined);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="rounded-full p-2 text-muted hover:bg-elevated hover:text-ink"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
