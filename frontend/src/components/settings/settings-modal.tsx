"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Fingerprint,
  KeyRound,
  LogOut,
  MonitorPlay,
  Palette,
  Plug,
  Search,
  Settings,
  Shield,
  Subtitles,
  UserRound,
  Users,
  X
} from "lucide-react";

import { useSession } from "@/components/session-provider";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

import {
  AccountPane,
  AppearancePane,
  IntegrationsPane,
  NotificationsPane,
  PasskeysPane,
  PlayerPane,
  PrivacyPane,
  ProfilePane,
  SessionsPane,
  SETTINGS_SEARCH,
  SitePane,
  SubtitlesPane
} from "./panes";
import { useSettings, type SettingsTab } from "./settings-provider";

const NAV: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "profile", label: "Profile", icon: Users },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "site", label: "Site", icon: Settings },
  { id: "player", label: "Player", icon: MonitorPlay },
  { id: "subtitles", label: "Subtitles", icon: Subtitles },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "sessions", label: "Sessions", icon: KeyRound },
  { id: "passkeys", label: "Passkeys", icon: Fingerprint }
];

const TITLES: Record<SettingsTab, { title: string; hint: string }> = {
  account: { title: "Account", hint: "Your Account settings." },
  profile: { title: "Profile", hint: "Customize your profile appearance" },
  privacy: { title: "Profile Privacy", hint: "Control what information is visible on your public profile." },
  appearance: { title: "Appearance", hint: "Customize the appearance of the site." },
  site: { title: "Site", hint: "Customize the site settings." },
  player: { title: "Player", hint: "Customize the player settings." },
  subtitles: { title: "Subtitles", hint: "Customize the rendering of subtitles." },
  notifications: { title: "Notifications", hint: "Customize how you receive notifications." },
  integrations: { title: "Integrations", hint: "Connect your account with other services." },
  sessions: { title: "Sessions", hint: "Manage your active sessions and sign out of devices." },
  passkeys: { title: "Passkeys", hint: "Manage your account passkeys." }
};

export function SettingsModal() {
  const { open, tab, query, prefs, note, closeSettings, setTab, setQuery, save } = useSettings();
  const { user, setUser, refresh } = useSession();
  const router = useRouter();

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV;
    const hits = new Set(
      SETTINGS_SEARCH.filter((row) => `${row.title} ${row.description}`.toLowerCase().includes(q)).map((row) => row.tab)
    );
    NAV.filter((item) => item.label.toLowerCase().includes(q)).forEach((item) => hits.add(item.id));
    return NAV.filter((item) => hits.has(item.id));
  }, [query]);

  useEffect(() => {
    if (!open || !query.trim() || filteredNav.some((item) => item.id === tab) || !filteredNav[0]) return;
    setTab(filteredNav[0].id);
  }, [open, query, filteredNav, tab, setTab]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeSettings();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeSettings]);

  if (!open) return null;

  async function signOut() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    await refresh();
    closeSettings();
    router.refresh();
  }

  const heading = TITLES[tab];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-label="Close settings" onClick={closeSettings} />
      <div className="relative flex h-[min(52rem,85dvh)] w-full max-w-6xl overflow-hidden rounded-2xl bg-white text-zinc-900 shadow-2xl">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <Settings className="size-5 text-zinc-500" />
              <div>
                <h2 id="settings-title" className="text-base font-semibold">
                  Settings
                </h2>
                <p className="text-xs text-zinc-500">Manage your preferences.</p>
              </div>
            </div>
            <label className="relative ml-auto min-w-[12rem] flex-1 max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search settings..."
                className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pr-3 pl-8 text-sm"
              />
            </label>
            {user ? (
              <button type="button" onClick={() => void signOut()} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100">
                <LogOut className="size-4" />
                Sign Out
              </button>
            ) : null}
            <button type="button" onClick={closeSettings} className="grid size-9 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100" aria-label="Close">
              <X className="size-4" />
            </button>
          </header>
          <div className="flex min-h-0 flex-1">
            <nav className="w-[11.5rem] shrink-0 overflow-y-auto border-r border-zinc-200 p-2" aria-label="Settings categories">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                const active = item.id === tab;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm",
                      active ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="min-w-0 flex-1 overflow-y-auto p-5">
              <div className="mb-5">
                <h3 className="text-lg font-semibold">{heading.title}</h3>
                <p className="text-sm text-zinc-500">{heading.hint}</p>
              </div>
              {tab === "account" ? <AccountPane prefs={prefs} save={save} /> : null}
              {tab === "profile" ? <ProfilePane prefs={prefs} save={save} /> : null}
              {tab === "privacy" ? <PrivacyPane prefs={prefs} save={save} query={query} /> : null}
              {tab === "appearance" ? <AppearancePane prefs={prefs} save={save} query={query} /> : null}
              {tab === "site" ? <SitePane prefs={prefs} save={save} query={query} /> : null}
              {tab === "player" ? <PlayerPane prefs={prefs} save={save} query={query} /> : null}
              {tab === "subtitles" ? <SubtitlesPane prefs={prefs} save={save} query={query} /> : null}
              {tab === "notifications" ? <NotificationsPane prefs={prefs} save={save} query={query} /> : null}
              {tab === "integrations" ? <IntegrationsPane /> : null}
              {tab === "sessions" ? <SessionsPane /> : null}
              {tab === "passkeys" ? <PasskeysPane /> : null}
              {note ? <p className="mt-6 text-sm text-zinc-500">{note}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
