"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, MonitorSmartphone, Smartphone } from "lucide-react";

import { useSession } from "@/components/session-provider";
import { api, type Me } from "@/lib/client-api";
import {
  CAROUSEL_SECTIONS,
  COLOR_FIELDS,
  PRESET_THEMES,
  THUMBNAIL_SECTIONS,
  defaultCarouselDrag,
  defaultColorFallback,
  defaultThumbnailType,
  initials,
  type CarouselSection,
  type ColorGroup,
  type ColorKey,
  type ThumbnailKind,
  type ThumbnailSection
} from "@/lib/user-settings";
import type { Preferences } from "@/lib/types";

import { CheckField, ColorField, NoteBox, NumberField, SelectField, SettingRow, SettingSection, TextField, ToggleSwitch } from "./controls";
import type { SettingsTab } from "./settings-provider";

type Save = (patch: Partial<Preferences>) => Promise<void>;

export const SETTINGS_SEARCH = [
  { tab: "account" as SettingsTab, title: "Display Name", description: "How others will see you" },
  { tab: "account" as SettingsTab, title: "Email Address", description: "Sign-in address" },
  { tab: "account" as SettingsTab, title: "New Password", description: "Change your password" },
  { tab: "account" as SettingsTab, title: "Delete Account", description: "Soft or hard delete" },
  { tab: "profile" as SettingsTab, title: "Profile Preview", description: "Avatar and banner" },
  { tab: "privacy" as SettingsTab, title: "Private Profile", description: "Hide your public profile" },
  { tab: "privacy" as SettingsTab, title: "Basic Stats", description: "Total shows and watch time" },
  { tab: "privacy" as SettingsTab, title: "Favorites", description: "Number of favorites" },
  { tab: "privacy" as SettingsTab, title: "Completion Stats", description: "Mean score and rates" },
  { tab: "appearance" as SettingsTab, title: "Theme", description: "Zinc Rose Blue Green Orange" },
  { tab: "appearance" as SettingsTab, title: "Enable Custom Theme", description: "Custom colors" },
  { tab: "site" as SettingsTab, title: "Title Language", description: "English or Romaji" },
  { tab: "site" as SettingsTab, title: "Show Filler Episodes", description: "Include filler" },
  { tab: "site" as SettingsTab, title: "Continue Watching", description: "Homepage continue rail" },
  { tab: "site" as SettingsTab, title: "Blur Thumbnails", description: "Episode thumbnails" },
  { tab: "player" as SettingsTab, title: "Auto Start", description: "Start playback automatically" },
  { tab: "player" as SettingsTab, title: "Auto Next Episode", description: "Play the next episode" },
  { tab: "player" as SettingsTab, title: "Skip Opening", description: "Skip intro automatically" },
  { tab: "subtitles" as SettingsTab, title: "Use Local Fonts", description: "Device fonts" },
  { tab: "notifications" as SettingsTab, title: "Enable Push Notifications", description: "Browser notifications" },
  { tab: "integrations" as SettingsTab, title: "AniList", description: "Sync your anime list" },
  { tab: "integrations" as SettingsTab, title: "MyAnimeList", description: "Sync your anime list" },
  { tab: "sessions" as SettingsTab, title: "Sessions", description: "Signed-in devices" },
  { tab: "passkeys" as SettingsTab, title: "Passkeys", description: "Passwordless login" }
];

function matches(query: string, title: string, description?: string) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return title.toLowerCase().includes(q) || (description ?? "").toLowerCase().includes(q);
}

async function readImageFile(file: File) {
  if (!/^image\/(jpeg|png|gif|jpg)$/i.test(file.type) && !/\.(jpe?g|png|gif)$/i.test(file.name)) {
    throw new Error("Invalid file type. Please upload an image file (jpeg, png, gif).");
  }
  if (file.size > 3 * 1024 * 1024) {
    throw new Error("File size exceeds the maximum limit of 3MB.");
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to upload image"));
    reader.readAsDataURL(file);
  });
}

export function AccountPane({ prefs, save }: { prefs: Preferences; save: Save }) {
  const { user, setUser, refresh } = useSession();
  const router = useRouter();
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [revealEmail, setRevealEmail] = useState(false);

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    await refresh();
    router.refresh();
  }

  if (!user) {
    return (
      <SettingSection title="Account Information" hint="Manage your display name and credentials">
        <NoteBox>You are browsing as a guest. Player and appearance choices stay on this device until you sign in.</NoteBox>
        <a href="/account" className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white">
          Sign in
        </a>
      </SettingSection>
    );
  }

  const masked = user.email.replace(/^(.{2}).*(@.*)$/, "$1••••$2");

  return (
    <div className="space-y-6">
      <SettingSection title="Account Information" hint="Manage your display name and credentials">
        <SettingRow title="Display Name" description="This is how others will see you on the site.">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const next = String(new FormData(event.currentTarget).get("displayName") ?? "");
              setError("");
              void api<{ user: Me }>("/auth/me", { method: "PATCH", body: JSON.stringify({ displayName: next }) })
                .then((result) => setUser(result.user))
                .catch((err: Error) => setError(err.message));
            }}
          >
            <input
              name="displayName"
              defaultValue={user.displayName}
              minLength={2}
              required
              className="h-9 w-44 rounded-lg border border-zinc-200 px-3 text-sm"
            />
            <button type="submit" className="h-9 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white">
              Update Account
            </button>
          </form>
        </SettingRow>
        <SettingRow title="Email Address" description={revealEmail ? user.email : "(Hover to reveal)"}>
          <p
            className="max-w-[16rem] truncate text-sm text-zinc-600"
            onMouseEnter={() => setRevealEmail(true)}
            onMouseLeave={() => setRevealEmail(false)}
          >
            {revealEmail ? user.email : masked}
          </p>
        </SettingRow>
        <SettingRow title="Language" description="Interface language for titles and menus.">
          <div className="flex rounded-lg border border-zinc-200 p-0.5">
            {(["en", "jp"] as const).map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => void save({ locale })}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${
                  prefs.locale === locale ? "bg-zinc-900 text-white" : "text-zinc-500"
                }`}
              >
                {locale === "jp" ? "日本語" : "English"}
              </button>
            ))}
          </div>
        </SettingRow>
      </SettingSection>
      <SettingSection title="New Password" hint="Password must be at least 8 characters long.">
        <form
          className="space-y-2 rounded-xl border border-zinc-200 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setError("");
            void api("/auth/password", {
              method: "POST",
              body: JSON.stringify({
                currentPassword: String(data.get("currentPassword") ?? ""),
                nextPassword: String(data.get("nextPassword") ?? "")
              })
            })
              .then(() => {
                setNote("Password updated. Other devices were signed out.");
                event.currentTarget.reset();
              })
              .catch((err: Error) => setError(err.message));
          }}
        >
          <input name="currentPassword" type="password" required placeholder="Current password" className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-sm" />
          <input name="nextPassword" type="password" required minLength={8} placeholder="New password" className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-sm" />
          <button type="submit" className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white">
            Update Account
          </button>
        </form>
      </SettingSection>
      <SettingSection title="Deletion Options" hint="Irreversible actions for your account">
        <NoteBox>
          <p className="font-medium text-zinc-800">Soft Delete:</p>
          <p>Anonymizes your data. You can re-register with the same email.</p>
          <p className="mt-2 font-medium text-zinc-800">Hard Delete:</p>
          <p>Complete removal of all personal data with a 14-day grace period.</p>
        </NoteBox>
        <p className="text-xs text-zinc-500">Account deletion is handled by staff on this catalog. Contact support if you need a soft or hard delete.</p>
      </SettingSection>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {note ? <p className="text-sm text-zinc-500">{note}</p> : null}
      <button type="button" onClick={() => void logout()} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
        Sign Out
      </button>
    </div>
  );
}

export function ProfilePane({ prefs, save }: { prefs: Preferences; save: Save }) {
  const { user } = useSession();
  const [error, setError] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const name = user?.displayName ?? "Guest";
  const letters = initials(name);

  async function onFile(kind: "profileAvatar" | "profileBanner", file?: File) {
    if (!file) return;
    setError("");
    try {
      const data = await readImageFile(file);
      await save({ [kind]: data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    }
  }

  return (
    <div className="space-y-6">
      <SettingSection title="Profile Preview" hint="Customize your profile appearance">
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            className="block h-28 w-full bg-cover bg-center"
            style={
              prefs.profileBanner
                ? { backgroundImage: `url(${prefs.profileBanner})` }
                : { background: `linear-gradient(120deg, oklch(0.72 0.14 ${prefs.profileHue}), oklch(0.55 0.1 ${prefs.profileHue + 40}))` }
            }
            aria-label="Change Banner"
          />
          <div className="relative px-4 pb-4">
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="-mt-8 grid size-16 place-items-center overflow-hidden rounded-full border-4 border-white text-sm font-bold text-white"
              style={
                prefs.profileAvatar
                  ? { backgroundImage: `url(${prefs.profileAvatar})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { background: `oklch(0.45 0.1 ${prefs.profileHue})` }
              }
              aria-label="Change avatar"
            >
              {prefs.profileAvatar ? null : letters}
            </button>
            <p className="mt-2 text-sm font-semibold text-zinc-900">{name}</p>
            <p className="text-xs text-zinc-500">{user ? `@${user.email.split("@")[0]}` : "Guest"}</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500">Click avatar to change profile picture</p>
        <p className="text-xs text-zinc-500">Click banner to change background</p>
        <p className="text-xs text-zinc-500">Supported formats: JPEG, PNG, GIF (max 3MB)</p>
        <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/gif" className="hidden" onChange={(event) => void onFile("profileAvatar", event.target.files?.[0])} />
        <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/gif" className="hidden" onChange={(event) => void onFile("profileBanner", event.target.files?.[0])} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </SettingSection>
    </div>
  );
}

const PRIVACY_GROUPS = [
  {
    label: "Statistics",
    hint: "Control visibility of your watch statistics",
    rows: [
      ["showBasicStats", "Basic Stats", "Total shows, episodes, and watch time"],
      ["showFavorites", "Favorites", "Number of shows in your favorites"],
      ["showCompletionStats", "Completion Stats", "Mean score, completion rate, drop rate, and rewatch rate"],
      ["showMilestones", "Milestones", "Days and hours watched milestones"]
    ]
  },
  {
    label: "Categories & Studios",
    hint: "Show or hide your top genres, themes, and studios",
    rows: [
      ["showTopGenres", "Top Genres", "Your most watched genres"],
      ["showTopThemes", "Top Themes", "Your most watched themes"],
      ["showTopDemographics", "Top Demographics", "Your most watched demographics (Shounen, Seinen, etc.)"],
      ["showTopStudios", "Top Studios", "Your most watched animation studios"]
    ]
  },
  {
    label: "Distributions",
    hint: "Control visibility of distribution charts",
    rows: [
      ["showStatusDistribution", "Status Distribution", "Shows by status (watching, completed, etc.)"],
      ["showScoreDistribution", "Score Distribution", "Your score breakdown from 1-10"],
      ["showTypeDistribution", "Type Distribution", "Shows by type (TV, Movie, OVA, etc.)"],
      ["showYearDistribution", "Year Distribution", "Shows by release year"],
      ["showSeasonDistribution", "Season Distribution", "Shows by season (Winter, Spring, Summer, Fall)"],
      ["showRatingDistribution", "Rating Distribution", "Shows by parental rating"]
    ]
  },
  {
    label: "Activity",
    hint: "Manage your activity and streak visibility",
    rows: [
      ["showActivityGraph", "Activity Graph", "Your watch activity over time"],
      ["showActivityStats", "Activity Stats", "Current streak, longest streak, and member since date"],
      ["showRecentActivity", "Recent Activity", "Recently completed and added anime"]
    ]
  }
] as const;

export function PrivacyPane({ prefs, save, query }: { prefs: Preferences; save: Save; query: string }) {
  return (
    <div className="space-y-8">
      <SettingSection title="Profile Visibility" hint="Control your overall profile visibility">
        <SettingRow
          title="Private Profile"
          description="Hide your entire public profile from other users"
          hidden={!matches(query, "Private Profile", "hidden")}
          danger
        >
          <ToggleSwitch checked={prefs.privateProfile} onChange={(privateProfile) => void save({ privateProfile })} label="Private Profile" />
        </SettingRow>
        {prefs.privateProfile ? (
          <NoteBox>
            Your public profile is currently hidden from other users. The settings below will not apply until you disable private profile mode.
          </NoteBox>
        ) : null}
      </SettingSection>
      {PRIVACY_GROUPS.map((group) => (
        <SettingSection key={group.label} title={group.label} hint={group.hint}>
          {group.rows.map(([key, title, description]) => (
            <SettingRow key={key} title={title} description={description} hidden={!matches(query, title, description)}>
              <ToggleSwitch checked={Boolean(prefs[key])} onChange={(next) => void save({ [key]: next })} label={title} />
            </SettingRow>
          ))}
        </SettingSection>
      ))}
    </div>
  );
}

export function AppearancePane({ prefs, save, query }: { prefs: Preferences; save: Save; query: string }) {
  const [group, setGroup] = useState<ColorGroup>("base");
  const [mode, setMode] = useState<"light" | "dark">(prefs.theme);
  const mapKey = mode === "light" ? "customColorsLight" : "customColorsDark";
  const map = prefs[mapKey];
  const fallback = defaultColorFallback[mode];
  const preview = { ...fallback, ...map };
  const [note, setNote] = useState("");

  function setColor(key: ColorKey, hex: string) {
    void save({ [mapKey]: { ...map, [key]: hex } });
  }

  return (
    <div className="space-y-6">
      <SettingSection title="Theme" hint="Choose a pre-built color theme">
        <div className="grid grid-cols-3 gap-2">
          {PRESET_THEMES.map((preset) => {
            const active = !prefs.useCustomColors && prefs.colorTheme === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => void save({ colorTheme: preset.name, useCustomColors: false })}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  active ? "border-2 border-zinc-900" : "border-zinc-200"
                }`}
              >
                <span className="size-5 rounded-full" style={{ background: preset.swatch }} />
                {preset.label}
              </button>
            );
          })}
        </div>
      </SettingSection>
      <SettingSection title="Custom Theme" hint="Create your own custom color theme">
        <SettingRow
          title="Enable Custom Theme"
          description="Use your custom colors instead of preset themes"
          hidden={!matches(query, "Enable Custom Theme", "custom")}
        >
          <ToggleSwitch
            checked={prefs.useCustomColors}
            onChange={(useCustomColors) => void save({ useCustomColors, colorTheme: useCustomColors ? "custom" : "zinc" })}
            label="Enable Custom Theme"
          />
        </SettingRow>
        <SettingRow title="Theme Name" hidden={!matches(query, "Theme Name")}>
          <TextField value={prefs.customThemeName} onChange={(customThemeName) => void save({ customThemeName })} placeholder="My Custom Theme" />
        </SettingRow>
        <SettingRow title="Editing Mode" description={`Customize colors separately for ${mode} mode`}>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  void save({ theme: item });
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${
                  mode === item ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-500"
                }`}
              >
                {item} Mode
              </button>
            ))}
          </div>
        </SettingRow>
        <div className="grid grid-cols-5 rounded-lg bg-zinc-100 p-1">
          {(["base", "primary", "muted", "ui", "sidebar"] as ColorGroup[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setGroup(item)}
              className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ${
                group === item ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              {item === "ui" ? "UI" : item}
            </button>
          ))}
        </div>
        {COLOR_FIELDS.filter((field) => field.group === group).map((field) => (
          <SettingRow key={field.key} title={field.label} description={field.hint} hidden={!matches(query, field.label, field.hint)}>
            <ColorField value={map[field.key]} fallback={fallback[field.key]} onChange={(hex) => setColor(field.key, hex)} />
          </SettingRow>
        ))}
        <div className="space-y-3 rounded-xl border border-zinc-200 p-4">
          <p className="text-sm font-medium">Preview ({mode === "light" ? "Light" : "Dark"} Mode)</p>
          <div className="space-y-3 rounded-lg p-4" style={{ backgroundColor: preview.background, color: preview.foreground }}>
            <div className="rounded-md border p-3" style={{ backgroundColor: preview.card, borderColor: preview.border }}>
              <p style={{ color: preview.cardForeground }}>Card Content</p>
              <p className="text-sm" style={{ color: preview.mutedForeground }}>
                Muted text
              </p>
            </div>
            <div className="flex gap-2">
              <span className="rounded-md px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: preview.primary, color: preview.primaryForeground }}>
                Primary
              </span>
              <span className="rounded-md px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: preview.secondary, color: preview.secondaryForeground }}>
                Secondary
              </span>
              <span className="rounded-md px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: preview.accent, color: preview.accentForeground }}>
                Accent
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-9 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white"
            onClick={() => {
              void save({ useCustomColors: true, colorTheme: "custom" });
              setNote("Custom theme saved!");
            }}
          >
            Save Theme
          </button>
          <button
            type="button"
            className="h-9 rounded-lg border border-zinc-200 px-3 text-sm font-medium"
            onClick={() => {
              void save({ [mapKey]: {} });
              setNote(`${mode === "light" ? "Light" : "Dark"} mode reset to defaults`);
            }}
          >
            Reset {mode === "light" ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            className="h-9 rounded-lg border border-zinc-200 px-3 text-sm font-medium"
            onClick={() => {
              void save({ customColorsLight: {}, customColorsDark: {}, useCustomColors: false, colorTheme: "zinc", customThemeName: "My Custom Theme" });
              setNote("Theme reset to defaults");
            }}
          >
            Reset All
          </button>
          <button
            type="button"
            className="h-9 rounded-lg border border-zinc-200 px-3 text-sm font-medium"
            onClick={() => {
              const blob = new Blob(
                [
                  JSON.stringify(
                    {
                      enabled: prefs.useCustomColors,
                      name: prefs.customThemeName,
                      colors: { light: prefs.customColorsLight, dark: prefs.customColorsDark }
                    },
                    null,
                    2
                  )
                ],
                { type: "application/json" }
              );
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "custom-theme.json";
              link.click();
              URL.revokeObjectURL(url);
              setNote("Theme exported!");
            }}
          >
            Export
          </button>
          <button
            type="button"
            className="h-9 rounded-lg border border-zinc-200 px-3 text-sm font-medium"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json";
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                try {
                  const parsed = JSON.parse(await file.text()) as {
                    enabled?: boolean;
                    name?: string;
                    colors?: { light?: Partial<Record<ColorKey, string>>; dark?: Partial<Record<ColorKey, string>> };
                  };
                  if (!parsed.colors?.light || !parsed.colors?.dark) {
                    setNote("Invalid theme file (must contain light and dark colors)");
                    return;
                  }
                  await save({
                    useCustomColors: Boolean(parsed.enabled),
                    customThemeName: parsed.name ?? prefs.customThemeName,
                    customColorsLight: parsed.colors.light,
                    customColorsDark: parsed.colors.dark,
                    colorTheme: parsed.enabled ? "custom" : "zinc"
                  });
                  setNote("Theme imported!");
                } catch {
                  setNote("Failed to import theme");
                }
              };
              input.click();
            }}
          >
            Import
          </button>
        </div>
        {note ? <p className="text-sm text-zinc-500">{note}</p> : null}
      </SettingSection>
    </div>
  );
}

const THUMB_LABELS: Record<ThumbnailSection, string> = {
  continueWatching: "Continue Watching",
  latest: "Latest Episodes",
  popular: "Popular",
  recentlyUpdated: "Recently Updated",
  seasonal: "Seasonal",
  history: "Watch History",
  updates: "Updates",
  series: "Anime Series"
};

const CAROUSEL_LABELS: Record<CarouselSection, string> = {
  continueWatching: "Continue Watching",
  latest: "Latest Episodes",
  popular: "Popular",
  recentlyUpdated: "Recently Updated",
  seasonal: "Seasonal"
};

export function SitePane({ prefs, save, query }: { prefs: Preferences; save: Save; query: string }) {
  const allThumbs = THUMBNAIL_SECTIONS.every((key) => prefs.thumbnailType[key] === prefs.thumbnailType.continueWatching);
  const allDrag = CAROUSEL_SECTIONS.every((key) => prefs.carouselDrag[key]);

  return (
    <div className="space-y-6">
      <SettingSection title="Title Language" hint="Choose the default language for anime titles.">
        <SettingRow title="Title Language" description="English uses catalog titles. Romaji prefers romanized names when available." hidden={!matches(query, "Title Language")}>
          <SelectField
            value={prefs.titleLanguage}
            onChange={(titleLanguage) => void save({ titleLanguage: titleLanguage as Preferences["titleLanguage"] })}
            options={[
              { value: "english", label: "English" },
              { value: "romaji", label: "Romaji" }
            ]}
          />
        </SettingRow>
      </SettingSection>
      <SettingSection title="Episodes" hint="Control which types of episodes are displayed">
        <SettingRow title="Show Filler Episodes" description="Include filler episodes in episode listings." hidden={!matches(query, "Filler")}>
          <ToggleSwitch checked={prefs.showFillers} onChange={(showFillers) => void save({ showFillers })} label="Show Filler Episodes" />
        </SettingRow>
        <SettingRow title="Show Recap Episodes" description="Include recap episodes in episode listings." hidden={!matches(query, "Recap")}>
          <ToggleSwitch checked={prefs.showRecaps} onChange={(showRecaps) => void save({ showRecaps })} label="Show Recap Episodes" />
        </SettingRow>
      </SettingSection>
      <SettingSection title="Thumbnails" hint="Customize how episode thumbnails appear across the site">
        <SettingRow title="All Sections" description="Set thumbnail style for all sections at once" hidden={!matches(query, "All Sections", "thumbnail")}>
          <SelectField
            value={allThumbs ? prefs.thumbnailType.continueWatching : "mixed"}
            onChange={(value) => {
              if (value !== "frame" && value !== "poster") return;
              const thumbnailType = { ...defaultThumbnailType };
              for (const key of THUMBNAIL_SECTIONS) thumbnailType[key] = value;
              void save({ thumbnailType });
            }}
            options={[
              { value: "frame", label: "Episode Image" },
              { value: "poster", label: "Anime Poster" },
              ...(allThumbs ? [] : [{ value: "mixed", label: "Mixed" }])
            ]}
          />
        </SettingRow>
        {THUMBNAIL_SECTIONS.map((key) => (
          <SettingRow key={key} title={THUMB_LABELS[key]} hidden={!matches(query, THUMB_LABELS[key], "thumbnail")}>
            <SelectField
              value={prefs.thumbnailType[key]}
              onChange={(value) => void save({ thumbnailType: { ...prefs.thumbnailType, [key]: value as ThumbnailKind } })}
              options={[
                { value: "frame", label: "Episode Image" },
                { value: "poster", label: "Anime Poster" }
              ]}
            />
          </SettingRow>
        ))}
        <SettingRow title="Blur Thumbnails" description="Apply a blur effect to all episode thumbnails." hidden={!matches(query, "Blur Thumbnails")}>
          <ToggleSwitch checked={prefs.blurThumbnails} onChange={(blurThumbnails) => void save({ blurThumbnails })} label="Blur Thumbnails" />
        </SettingRow>
        <SettingRow title="Unblur Watched Episodes" description="Automatically reveal thumbnails for episodes you've finished watching." hidden={!matches(query, "Unblur")}>
          <ToggleSwitch checked={prefs.unblurWatched} onChange={(unblurWatched) => void save({ unblurWatched })} label="Unblur Watched Episodes" />
        </SettingRow>
        <SettingRow title="Dim Completed Episodes" description="Lower opacity for fully watched episodes in listings." hidden={!matches(query, "Dim Completed")}>
          <ToggleSwitch checked={prefs.dimCompleted} onChange={(dimCompleted) => void save({ dimCompleted })} label="Dim Completed Episodes" />
        </SettingRow>
        <SettingRow title="Grayscale Completed Episodes" description="Apply grayscale to thumbnails for fully watched episodes in listings." hidden={!matches(query, "Grayscale")}>
          <ToggleSwitch checked={prefs.grayscaleCompleted} onChange={(grayscaleCompleted) => void save({ grayscaleCompleted })} label="Grayscale Completed Episodes" />
        </SettingRow>
      </SettingSection>
      <SettingSection title="Homepage" hint="Customize your homepage experience">
        <SettingRow title="Show Continue Watching" description='Display the "Continue Watching" section on the homepage.' hidden={!matches(query, "Show Continue Watching")}>
          <ToggleSwitch checked={prefs.showContinueWatching} onChange={(showContinueWatching) => void save({ showContinueWatching })} label="Show Continue Watching" />
        </SettingRow>
        <SettingRow title="Hide Caught Up Shows" description="Hide shows you're fully caught up on from Continue Watching." hidden={!matches(query, "Hide Caught Up")}>
          <ToggleSwitch checked={prefs.hideCaughtUp} onChange={(hideCaughtUp) => void save({ hideCaughtUp })} label="Hide Caught Up Shows" />
        </SettingRow>
        <SettingRow title="Disable Floating Player" description="Prevent the floating mini-player from appearing when navigating away." hidden={!matches(query, "Floating Player")}>
          <ToggleSwitch checked={prefs.disableFloatingPlayer} onChange={(disableFloatingPlayer) => void save({ disableFloatingPlayer })} label="Disable Floating Player" />
        </SettingRow>
      </SettingSection>
      <SettingSection title="Carousel Interaction" hint="Enable or disable mouse dragging for homepage carousels">
        <SettingRow title="Select All" description="Toggle mouse drag for all carousel sections at once" hidden={!matches(query, "Select All", "carousel")}>
          <CheckField
            checked={allDrag}
            label="Select All"
            onChange={(next) => {
              const carouselDrag = { ...defaultCarouselDrag };
              for (const key of CAROUSEL_SECTIONS) carouselDrag[key] = next;
              void save({ carouselDrag });
            }}
          />
        </SettingRow>
        {CAROUSEL_SECTIONS.map((key) => (
          <SettingRow key={key} title={CAROUSEL_LABELS[key]} hidden={!matches(query, CAROUSEL_LABELS[key], "drag")}>
            <CheckField
              checked={prefs.carouselDrag[key]}
              label={CAROUSEL_LABELS[key]}
              onChange={(next) => void save({ carouselDrag: { ...prefs.carouselDrag, [key]: next } })}
            />
          </SettingRow>
        ))}
      </SettingSection>
    </div>
  );
}

export function PlayerPane({ prefs, save, query }: { prefs: Preferences; save: Save; query: string }) {
  return (
    <div className="space-y-6">
      <SettingSection title="Display" hint="Immersive mode shows a fullscreen player. Theater mode shows the player with comments.">
        <SettingRow title="View Mode" hidden={!matches(query, "View Mode")}>
          <SelectField
            value={prefs.viewMode}
            onChange={(viewMode) => void save({ viewMode: viewMode as Preferences["viewMode"] })}
            options={[
              { value: "immersive", label: "Immersive" },
              { value: "theater", label: "Theater" }
            ]}
          />
        </SettingRow>
        <SettingRow title="Fullscreen Target" description="Player fullscreens only the video player. Document fullscreens the entire page." hidden={!matches(query, "Fullscreen Target")}>
          <SelectField
            value={prefs.fullscreenTarget}
            onChange={(fullscreenTarget) => void save({ fullscreenTarget: fullscreenTarget as Preferences["fullscreenTarget"] })}
            options={[
              { value: "player", label: "Player" },
              { value: "document", label: "Document" }
            ]}
          />
        </SettingRow>
        <SettingRow title="Auto Landscape on Fullscreen" hidden={!matches(query, "Auto Landscape")}>
          <ToggleSwitch
            checked={prefs.mobileLandscapeOnFullscreen}
            onChange={(mobileLandscapeOnFullscreen) => void save({ mobileLandscapeOnFullscreen })}
            label="Auto Landscape on Fullscreen"
          />
        </SettingRow>
      </SettingSection>
      <SettingSection title="Playback" hint="Control how videos start and play">
        <SettingRow title="Auto Start" description="Automatically start playing the episode when the page loads." hidden={!matches(query, "Auto Start")}>
          <ToggleSwitch checked={prefs.autoStart} onChange={(autoStart) => void save({ autoStart, autoPlay: autoStart })} label="Auto Start" />
        </SettingRow>
        <SettingRow title="Auto Fullscreen" hidden={!matches(query, "Auto Fullscreen")}>
          <ToggleSwitch checked={prefs.autoFullscreen} onChange={(autoFullscreen) => void save({ autoFullscreen })} label="Auto Fullscreen" />
        </SettingRow>
        <SettingRow title="Pause When Not In Focus" description="Automatically pause the video when you switch to another tab or window." hidden={!matches(query, "Pause When Not In Focus")}>
          <ToggleSwitch checked={prefs.pauseWhenNotInFocus} onChange={(pauseWhenNotInFocus) => void save({ pauseWhenNotInFocus })} label="Pause When Not In Focus" />
        </SettingRow>
        <SettingRow title="Default Quality" description="The default video quality. Auto will adjust based on your connection." hidden={!matches(query, "Default Quality")}>
          <SelectField
            value={prefs.defaultQuality}
            onChange={(defaultQuality) => void save({ defaultQuality: defaultQuality as Preferences["defaultQuality"] })}
            options={[
              { value: "auto", label: "Auto" },
              { value: "1080p", label: "1080p" },
              { value: "720p", label: "720p" },
              { value: "480p", label: "480p" }
            ]}
          />
        </SettingRow>
        <SettingRow title="Default Audio" description="The default audio language when available." hidden={!matches(query, "Default Audio")}>
          <SelectField
            value={prefs.defaultAudio}
            onChange={(defaultAudio) => void save({ defaultAudio: defaultAudio as Preferences["defaultAudio"] })}
            options={[
              { value: "jpn", label: "Japanese" },
              { value: "eng", label: "English" }
            ]}
          />
        </SettingRow>
        <SettingRow title="Stream Codec" description="Preferred video codec." hidden={!matches(query, "Stream Codec")}>
          <SelectField
            value={prefs.streamCodec}
            onChange={(streamCodec) => void save({ streamCodec: streamCodec as Preferences["streamCodec"] })}
            options={[
              { value: "av1", label: "AV1 (Default)" },
              { value: "hevc", label: "HEVC" }
            ]}
          />
        </SettingRow>
        <SettingRow title="AV1 Compatibility Fallback" description="Convert AV1 to H.264 while playing when this device cannot decode AV1." hidden={!matches(query, "AV1 Compatibility")}>
          <ToggleSwitch
            checked={prefs.av1CompatibilityFallback}
            onChange={(av1CompatibilityFallback) => void save({ av1CompatibilityFallback })}
            label="AV1 Compatibility Fallback"
          />
        </SettingRow>
        <SettingRow title="Force AV1 Transcoding" hidden={!matches(query, "Force AV1")}>
          <ToggleSwitch checked={prefs.forceAv1Transcode} onChange={(forceAv1Transcode) => void save({ forceAv1Transcode })} label="Force AV1 Transcoding" />
        </SettingRow>
        <SettingRow title="H.264 Transcode Quality" hidden={!matches(query, "Transcode Quality")}>
          <SelectField
            value={prefs.av1TranscodeQuality}
            onChange={(av1TranscodeQuality) => void save({ av1TranscodeQuality: av1TranscodeQuality as Preferences["av1TranscodeQuality"] })}
            options={[
              { value: "balanced", label: "Balanced" },
              { value: "high", label: "High" }
            ]}
          />
        </SettingRow>
        <SettingRow title="Enable Subtitles" description="Show subtitles by default when available." hidden={!matches(query, "Enable Subtitles")}>
          <ToggleSwitch checked={prefs.enableSubtitles} onChange={(enableSubtitles) => void save({ enableSubtitles })} label="Enable Subtitles" />
        </SettingRow>
      </SettingSection>
      <SettingSection title="Auto Next" hint="Configure automatic episode progression and skip options">
        <SettingRow title="Auto Next Episode" description="Automatically play the next episode when the current one ends." hidden={!matches(query, "Auto Next Episode")}>
          <ToggleSwitch checked={prefs.autoNext} onChange={(autoNext) => void save({ autoNext })} label="Auto Next Episode" />
        </SettingRow>
        <SettingRow title="Auto Next Episode Delay" hidden={!matches(query, "Auto Next Episode Delay")}>
          <NumberField value={prefs.autoNextDelay} min={0} max={30} onChange={(autoNextDelay) => void save({ autoNextDelay })} />
        </SettingRow>
        <SettingRow title="Watched Threshold (%)" description="How far you must watch before an episode counts as complete." hidden={!matches(query, "Watched Threshold")}>
          <NumberField value={prefs.watchedThreshold} min={50} max={100} onChange={(watchedThreshold) => void save({ watchedThreshold })} />
        </SettingRow>
        <SettingRow title="Auto Skip Opening" description="Automatically skip the opening sequence." hidden={!matches(query, "Auto Skip Opening")}>
          <ToggleSwitch checked={prefs.autoSkipIntro} onChange={(autoSkipIntro) => void save({ autoSkipIntro })} label="Auto Skip Opening" />
        </SettingRow>
        <SettingRow title="Skip Opening Button Duration" description="How many seconds the skip opening button stays visible." hidden={!matches(query, "Skip Opening Button")}>
          <NumberField value={prefs.skipOpeningButtonDuration} min={1} max={30} onChange={(skipOpeningButtonDuration) => void save({ skipOpeningButtonDuration })} />
        </SettingRow>
        <SettingRow title="Auto Skip Ending" description="Automatically skip the ending sequence." hidden={!matches(query, "Auto Skip Ending")}>
          <ToggleSwitch checked={prefs.autoSkipEnding} onChange={(autoSkipEnding) => void save({ autoSkipEnding })} label="Auto Skip Ending" />
        </SettingRow>
        <SettingRow title="Skip Ending Button Duration" description="How many seconds the skip ending button stays visible." hidden={!matches(query, "Skip Ending Button")}>
          <NumberField value={prefs.skipEndingButtonDuration} min={1} max={30} onChange={(skipEndingButtonDuration) => void save({ skipEndingButtonDuration })} />
        </SettingRow>
      </SettingSection>
      <SettingSection title="Gestures" hint="Configure touch and click gestures for the player">
        <SettingRow title="Tap to Play/Pause" description="Tap or click anywhere on the video to toggle play/pause." hidden={!matches(query, "Tap to Play")}>
          <ToggleSwitch checked={prefs.tapToPlayPause} onChange={(tapToPlayPause) => void save({ tapToPlayPause })} label="Tap to Play/Pause" />
        </SettingRow>
        <SettingRow title="Double Tap to Seek Backwards" description="Double tap or click on the left side of the video to seek backwards." hidden={!matches(query, "Seek Backwards")}>
          <ToggleSwitch checked={prefs.doubleTapSeekBack} onChange={(doubleTapSeekBack) => void save({ doubleTapSeekBack })} label="Double tap back" />
        </SettingRow>
        <SettingRow title="Seek Backwards Time" description="Seconds to seek backwards. Also applies to the seek button." hidden={!matches(query, "Seek Backwards Time")}>
          <NumberField value={prefs.seekBackSeconds} min={1} max={60} onChange={(seekBackSeconds) => void save({ seekBackSeconds })} />
        </SettingRow>
        <SettingRow title="Double Tap to Seek Forwards" description="Double tap or click on the right side of the video to seek forwards." hidden={!matches(query, "Seek Forwards")}>
          <ToggleSwitch checked={prefs.doubleTapSeekForward} onChange={(doubleTapSeekForward) => void save({ doubleTapSeekForward })} label="Double tap forward" />
        </SettingRow>
        <SettingRow title="Seek Forwards Time" description="Seconds to seek forwards. Also applies to the seek button." hidden={!matches(query, "Seek Forwards Time")}>
          <NumberField value={prefs.seekForwardSeconds} min={1} max={60} onChange={(seekForwardSeconds) => void save({ seekForwardSeconds })} />
        </SettingRow>
      </SettingSection>
      <SettingSection title="Advanced" hint="Performance and buffering options for advanced users">
        <SettingRow title="Progressive Loading" description="Load the stream in chunks instead of a large buffer." hidden={!matches(query, "Progressive")}>
          <ToggleSwitch checked={prefs.progressiveLoading} onChange={(progressiveLoading) => void save({ progressiveLoading })} label="Progressive Loading" />
        </SettingRow>
        <SettingRow title="Chunk Size (KB)" hidden={!matches(query, "Chunk Size")}>
          <NumberField value={prefs.chunkSizeKb} min={32} max={512} step={32} onChange={(chunkSizeKb) => void save({ chunkSizeKb })} />
        </SettingRow>
      </SettingSection>
    </div>
  );
}

export function SubtitlesPane({ prefs, save, query }: { prefs: Preferences; save: Save; query: string }) {
  return (
    <SettingSection title="Fonts & Quality" hint="Configure font access and rendering quality">
      <SettingRow title="Use Local Fonts" description="Prefer fonts installed on this device for captions." hidden={!matches(query, "Use Local Fonts")}>
        <ToggleSwitch checked={prefs.useLocalFonts} onChange={(useLocalFonts) => void save({ useLocalFonts })} label="Use Local Fonts" />
      </SettingRow>
      <SettingRow title="Prescale Factor" hidden={!matches(query, "Prescale Factor")}>
        <NumberField value={prefs.prescaleFactor} min={0.5} max={4} step={0.1} onChange={(prescaleFactor) => void save({ prescaleFactor })} />
      </SettingRow>
      <SettingRow title="Prescale Height Limit" description="Height in pixels beyond which subtitles won't be prescaled." hidden={!matches(query, "Prescale Height")}>
        <NumberField value={prefs.prescaleHeightLimit} min={360} max={4320} step={120} onChange={(prescaleHeightLimit) => void save({ prescaleHeightLimit })} />
      </SettingRow>
      <SettingRow title="Max Render Height" hidden={!matches(query, "Max Render")}>
        <NumberField value={prefs.maxRenderHeight} min={360} max={4320} step={120} onChange={(maxRenderHeight) => void save({ maxRenderHeight })} />
      </SettingRow>
    </SettingSection>
  );
}

export function NotificationsPane({ prefs, save, query }: { prefs: Preferences; save: Save; query: string }) {
  const [pushNote, setPushNote] = useState("");
  const supported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;

  return (
    <div className="space-y-6">
      <SettingSection title="Notifications" hint="Customize how you receive notifications.">
        <SettingRow
          title="Enable Push Notifications"
          description="Receive notifications when new content is available."
          hidden={!matches(query, "Enable Push Notifications")}
        >
          <ToggleSwitch
            checked={prefs.enablePushNotifications}
            onChange={(enablePushNotifications) => {
              if (enablePushNotifications && supported && Notification.permission === "default") {
                void Notification.requestPermission().then((permission) => {
                  void save({ enablePushNotifications: permission === "granted" });
                  if (permission !== "granted") setPushNote("Notifications Blocked");
                });
                return;
              }
              void save({ enablePushNotifications });
            }}
            label="Enable Push Notifications"
          />
        </SettingRow>
        {!supported ? (
          <NoteBox>Push notifications are not supported in this browser. Try using Chrome, Edge, or Firefox.</NoteBox>
        ) : null}
        {pushNote ? <p className="text-sm text-red-600">{pushNote}</p> : null}
        <SettingRow title="New episodes" description="When a title you follow gets a new episode." hidden={!matches(query, "New episodes")}>
          <ToggleSwitch checked={prefs.notifyNewEpisodes} onChange={(notifyNewEpisodes) => void save({ notifyNewEpisodes })} label="New episodes" />
        </SettingRow>
        <SettingRow title="Follow activity" description="Staff publishes and follow-related inbox items." hidden={!matches(query, "Follow")}>
          <ToggleSwitch checked={prefs.notifyFollows} onChange={(notifyFollows) => void save({ notifyFollows })} label="Follow activity" />
        </SettingRow>
        <SettingRow title="Community" description="Replies and board posts." hidden={!matches(query, "Community")}>
          <ToggleSwitch checked={prefs.notifyCommunity} onChange={(notifyCommunity) => void save({ notifyCommunity })} label="Community" />
        </SettingRow>
      </SettingSection>
      <a href="/notifications" className="text-sm font-medium text-zinc-900 underline-offset-2 hover:underline">
        Open notification inbox
      </a>
    </div>
  );
}

export function IntegrationsPane() {
  const [note, setNote] = useState("");
  return (
    <SettingSection title="Integrations" hint="Link your anime tracking accounts to sync your watch history">
      {[
        { name: "AniList", blurb: "Sync your anime list with AniList", color: "#02a9ff" },
        { name: "MyAnimeList", blurb: "Sync your anime list with MyAnimeList", color: "#2e51a2" }
      ].map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4">
          <div>
            <p className="flex items-center gap-3 text-base font-semibold">
              <span className="grid size-8 place-items-center rounded-md text-xs font-bold text-white" style={{ background: item.color }}>
                {item.name.slice(0, 2)}
              </span>
              {item.name}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{item.blurb}</p>
          </div>
          <button
            type="button"
            className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white"
            onClick={() => setNote(`${item.name} Connect is not available on this catalog. Lists stay on your Anemi account.`)}
          >
            Connect
          </button>
        </div>
      ))}
      {note ? <p className="text-sm text-zinc-500">{note}</p> : null}
    </SettingSection>
  );
}

export function SessionsPane() {
  const { user } = useSession();
  const [current, setCurrent] = useState<{ os: string; browser: string } | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    api<{ current: { os: string; browser: string } }>("/auth/sessions")
      .then((data) => setCurrent(data.current))
      .catch(() => undefined);
  }, [user]);

  if (!user) {
    return (
      <SettingSection title="Sessions" hint="Manage your active sessions and sign out of devices.">
        <NoteBox>Sign in to see this device and revoke other sessions.</NoteBox>
      </SettingSection>
    );
  }

  return (
    <div className="space-y-6">
      <SettingSection title="Sessions" hint="Manage your active sessions and sign out of devices.">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <MonitorSmartphone className="size-5 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              {current?.os ?? "This device"}
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                Current
              </span>
            </p>
            <p className="text-xs text-zinc-500">{current?.browser ?? "The device you're currently using"}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 px-4 py-10 text-center">
          <Smartphone className="size-6 text-zinc-400" />
          <p className="text-sm text-zinc-500">No other active sessions. You&apos;re only signed in on this device.</p>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          onClick={() => {
            void api("/auth/sessions/revoke", { method: "POST" })
              .then(() => setNote("Other devices were signed out. This one stayed signed in."))
              .catch((err: Error) => setNote(err.message));
          }}
        >
          Sign out other devices
        </button>
        {note ? <p className="text-sm text-zinc-500">{note}</p> : null}
      </SettingSection>
    </div>
  );
}

export function PasskeysPane() {
  const { user } = useSession();
  const [note, setNote] = useState("");
  return (
    <SettingSection title="Passkeys" hint="Manage your account passkeys.">
      <p className="text-sm text-zinc-500">Passwordless authentication using biometrics or security keys</p>
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 px-4 py-12 text-center">
        <Fingerprint className="size-8 text-zinc-400" />
        <p className="text-sm text-zinc-500">No passkeys registered yet. Add a passkey for secure, passwordless login.</p>
      </div>
      <button
        type="button"
        className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white"
        onClick={() => {
          if (!user) {
            setNote("Sign in to add a passkey.");
            return;
          }
          setNote("Passkeys are not enabled on this catalog. Use two-factor authentication from Account instead.");
        }}
      >
        Add Passkey
      </button>
      <details className="rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-600">
        <summary className="cursor-pointer font-medium text-zinc-900">What are passkeys?</summary>
        <p className="mt-2">
          Passkeys replace passwords with a device credential — fingerprint, face unlock, or a hardware key. This catalog stores playback and list data on your Anemi account; TOTP two-factor is the supported extra factor.
        </p>
      </details>
      {note ? <p className="text-sm text-zinc-500">{note}</p> : null}
    </SettingSection>
  );
}
