"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  Clock,
  ExternalLink,
  Eye,
  Flame,
  Heart,
  ImageIcon,
  PieChart,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Star,
  Target,
  Trophy,
  Tv,
  TrendingDown
} from "lucide-react";

import { initials } from "@/lib/user-settings";
import type { NamedCount, ProfilePerson, ProfileStats, ProfileVisibility } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ActivityChart, RangeToggle, ScoreChart } from "@/components/profile-charts";

const STATUS_COLOR: Record<string, string> = {
  WATCHING: "var(--profile-watching)",
  COMPLETED: "var(--profile-completed)",
  ON_HOLD: "var(--profile-hold)",
  DROPPED: "var(--profile-dropped)",
  PLAN_TO_WATCH: "var(--profile-plan)"
};

const ALL_VISIBLE: ProfileVisibility = {
  showBasicStats: true,
  showFavorites: true,
  showCompletionStats: true,
  showActivityStats: true,
  showActivityGraph: true,
  showStatusDistribution: true,
  showScoreDistribution: true,
  showTopGenres: true,
  showTopThemes: true,
  showTopDemographics: true,
  showTopStudios: true
};

function formatWatchTime(sec: number) {
  const total = Math.max(0, Math.floor(sec));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function memberSince(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function downloadStatsImage(person: ProfilePerson, stats: ProfileStats) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#e8f1f7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 48, 48, 1104, 534, 24);
  ctx.fill();
  ctx.fillStyle = "#111827";
  ctx.font = "700 42px Geist, ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(person.displayName.toUpperCase(), 88, 150);
  ctx.fillStyle = "#6b7280";
  ctx.font = "500 22px Geist, ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Anemi profile", 88, 186);
  const cells = [
    ["Shows", String(stats.shows)],
    ["Episodes", String(stats.episodes)],
    ["Watch Time", formatWatchTime(stats.watchTimeSec)],
    ["Mean Score", stats.meanScore.toFixed(1)]
  ];
  cells.forEach((cell, index) => {
    const x = 88 + index * 260;
    ctx.fillStyle = "#f3f4f6";
    roundRect(ctx, x, 250, 236, 220, 16);
    ctx.fill();
    ctx.fillStyle = "#6b7280";
    ctx.font = "600 18px Geist, ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(cell[0] ?? "", x + 24, 300);
    ctx.fillStyle = "#111827";
    ctx.font = "700 36px Geist, ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(cell[1] ?? "", x + 24, 360);
  });
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = `${person.displayName.replace(/\s+/g, "-").toLowerCase()}-stats.png`;
  link.click();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function ProfileDashboard({
  person,
  stats,
  mine,
  visibility,
  publicHref
}: {
  person: ProfilePerson;
  stats: ProfileStats | null;
  mine?: boolean;
  visibility?: ProfileVisibility;
  publicHref?: string;
}) {
  const flags = mine ? ALL_VISIBLE : (visibility ?? ALL_VISIBLE);
  const since = memberSince(person.createdAt);
  const registered = person.role === "ADMIN" || person.role === "MODERATOR" ? "Staff" : "Registered";
  const avatar = person.avatar;
  const letter = initials(person.displayName).slice(0, 1);

  return (
    <main className="page-shell space-y-5 py-8 pb-16 xl:py-10">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-5">
          <div
            className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--avatar-bg)] text-3xl font-bold text-muted shadow-[0_10px_30px_rgb(17_24_39_/_0.08)] sm:size-28"
            style={avatar ? { backgroundImage: `url(${avatar})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          >
            {avatar ? null : letter}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight uppercase sm:text-3xl">{person.displayName}</h1>
              <span className="profile-pill">{registered}</span>
            </div>
            {since ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                <CalendarDays className="size-3.5" />
                Member since {since}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {flags.showBasicStats || flags.showCompletionStats ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {flags.showBasicStats ? (
            <MiniStat icon={Tv} label="Shows" value={String(stats?.shows ?? 0)} />
          ) : null}
          {flags.showBasicStats ? (
            <MiniStat icon={Play} label="Episodes" value={String(stats?.episodes ?? 0)} />
          ) : null}
          {flags.showBasicStats ? (
            <MiniStat icon={Clock} label="Watch Time" value={formatWatchTime(stats?.watchTimeSec ?? 0)} />
          ) : null}
          {flags.showCompletionStats ? (
            <MiniStat icon={Star} label="Mean Score" value={(stats?.meanScore ?? 0).toFixed(1)} />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {publicHref ? (
          <Link href={publicHref} className="profile-btn profile-btn-solid">
            <Eye className="size-4" />
            View Public Profile
          </Link>
        ) : null}
        <button
          type="button"
          className="profile-btn profile-btn-ghost"
          onClick={() => stats && downloadStatsImage(person, stats)}
          disabled={!stats}
        >
          <ImageIcon className="size-4" />
          Stats Image
          <ExternalLink className="size-3.5 text-muted" />
        </button>
        <a href="#watch-activity" className="profile-btn profile-btn-ghost">
          <BarChart3 className="size-4" />
          Advanced Stats
          <ExternalLink className="size-3.5 text-muted" />
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {flags.showActivityStats ? (
          <PastelStat
            label="Current Streak"
            value={`${stats?.currentStreak ?? 0} days`}
            tone="streak"
            icon={Flame}
          />
        ) : null}
        {flags.showActivityStats ? (
          <PastelStat
            label="Longest Streak"
            value={`${stats?.longestStreak ?? 0} days`}
            tone="longest"
            icon={Trophy}
          />
        ) : null}
        {flags.showCompletionStats ? (
          <PastelStat
            label="Completion Rate"
            value={`${stats?.completionRate ?? 0}%`}
            tone="complete"
            icon={Target}
          />
        ) : null}
        {flags.showFavorites ? (
          <PastelStat
            label="Favorites"
            value={`${stats?.favorites ?? 0} shows`}
            tone="fav"
            icon={Heart}
          />
        ) : null}
      </div>

      {flags.showStatusDistribution || flags.showScoreDistribution ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {flags.showStatusDistribution ? <CollectionCard stats={stats} /> : null}
          {flags.showScoreDistribution ? <ScoreCard stats={stats} /> : null}
        </div>
      ) : null}

      <PreferencesCard stats={stats} flags={flags} />

      {flags.showActivityGraph ? <WatchActivityCard stats={stats} /> : null}

      <div id="advanced-stats" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FootStat icon={RotateCcw} label="Total Rewatches" value={String(stats?.totalRewatches ?? 0)} />
        {flags.showCompletionStats ? (
          <FootStat icon={TrendingDown} label="Drop Rate" value={`${(stats?.dropRate ?? 0).toFixed(1)}%`} />
        ) : null}
        {flags.showCompletionStats ? (
          <FootStat icon={RotateCcw} label="Rewatch Rate" value={`${(stats?.rewatchRate ?? 0).toFixed(1)}%`} />
        ) : null}
        {flags.showTopStudios ? (
          <FootStat icon={Building2} label="Top Studio" value={stats?.topStudio ?? "N/A"} />
        ) : null}
      </div>
    </main>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Tv;
  label: string;
  value: string;
}) {
  return (
    <div className="profile-card flex items-center gap-3 py-4">
      <span className="grid size-10 place-items-center rounded-xl bg-elevated text-muted">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="text-lg font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function PastelStat({
  label,
  value,
  tone,
  icon: Icon
}: {
  label: string;
  value: string;
  tone: "streak" | "longest" | "complete" | "fav";
  icon: typeof Flame;
}) {
  const bg = {
    streak: "var(--profile-streak)",
    longest: "var(--profile-longest)",
    complete: "var(--profile-complete)",
    fav: "var(--profile-fav)"
  }[tone];
  return (
    <div className="flex items-center justify-between rounded-[0.85rem] px-4 py-4" style={{ background: bg }}>
      <div>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      </div>
      <span className="grid size-11 place-items-center rounded-full bg-surface/80 text-ink">
        <Icon className="size-5" />
      </span>
    </div>
  );
}

function FootStat({
  icon: Icon,
  label,
  value
}: {
  icon: typeof RotateCcw;
  label: string;
  value: string;
}) {
  return (
    <div className="profile-card flex flex-col items-center py-6 text-center">
      <Icon className="size-5 text-muted" />
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

function CollectionCard({ stats }: { stats: ProfileStats | null }) {
  const rows = stats?.collection ?? [];
  const total = rows.reduce((sum, item) => sum + item.count, 0);
  return (
    <section className="profile-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <PieChart className="size-4 text-muted" />
            Collection Status
          </h2>
          <p className="mt-1 text-sm text-muted">{total} total shows in your collection</p>
        </div>
        <StatusDonut rows={rows} total={total} />
      </div>
      <ul className="space-y-2">
        {rows.map((item) => (
          <li key={item.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: STATUS_COLOR[item.key] }} />
              {item.label}
            </span>
            <span className="tabular-nums text-muted">{item.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatusDonut({
  rows,
  total
}: {
  rows: { key: string; count: number }[];
  total: number;
}) {
  let offset = 0;
  return (
    <svg viewBox="0 0 42 42" className="size-16 shrink-0 -rotate-90">
      <circle cx="21" cy="21" r="15.5" fill="none" stroke="var(--color-elevated)" strokeWidth="6" />
      {total
        ? rows.map((item) => {
            const pct = (item.count / total) * 100;
            const circle = (
              <circle
                key={item.key}
                cx="21"
                cy="21"
                r="15.5"
                fill="none"
                stroke={STATUS_COLOR[item.key]}
                strokeWidth="6"
                pathLength="100"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={-offset}
              />
            );
            offset += pct;
            return circle;
          })
        : null}
    </svg>
  );
}

function ScoreCard({ stats }: { stats: ProfileStats | null }) {
  const scores = stats?.scores ?? Array.from({ length: 10 }, () => 0);
  return (
    <section className="profile-card">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <BarChart3 className="size-4 text-muted" />
        Score Distribution
      </h2>
      <p className="mt-1 text-sm text-muted">How you rate your shows</p>
      <div className="mt-4">
        <ScoreChart scores={scores} stacks={stats?.scoreStacks} />
      </div>
    </section>
  );
}

function PreferencesCard({
  stats,
  flags
}: {
  stats: ProfileStats | null;
  flags: ProfileVisibility;
}) {
  const tabs = [
    flags.showTopGenres ? ({ id: "genres", label: "Genres", items: stats?.genres ?? [] } as const) : null,
    flags.showTopThemes ? ({ id: "themes", label: "Themes", items: stats?.themes ?? [] } as const) : null,
    flags.showTopDemographics ? ({ id: "demo", label: "Demo", items: stats?.demographics ?? [] } as const) : null,
    flags.showTopStudios ? ({ id: "studios", label: "Studios", items: stats?.studios ?? [] } as const) : null
  ].filter(Boolean) as { id: string; label: string; items: NamedCount[] }[];
  const [tab, setTab] = useState(tabs[0]?.id ?? "genres");
  const active = tabs.find((item) => item.id === tab) ?? tabs[0];
  if (!tabs.length) return null;
  const max = Math.max(1, ...(active?.items.map((item) => item.count) ?? [1]));

  return (
    <section className="profile-card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <SlidersHorizontal className="size-4 text-muted" />
            Your Preferences
          </h2>
          <p className="mt-1 text-sm text-muted">Most watched categories</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                item.id === active?.id ? "bg-elevated text-ink" : "text-muted hover:text-ink"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {!active?.items.length ? (
        <p className="grid min-h-36 place-items-center text-sm text-muted">No data available</p>
      ) : (
        <ul className="space-y-3">
          {active.items.map((item) => (
            <li key={item.slug}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <span className="tabular-nums text-muted">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-elevated">
                <span className="block h-full rounded-full bg-ink" style={{ width: `${(item.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WatchActivityCard({ stats }: { stats: ProfileStats | null }) {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("monthly");
  const points = stats?.activity[range] ?? [];
  return (
    <section id="watch-activity" className="profile-card scroll-mt-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Activity className="size-4 text-muted" />
            Watch Activity
          </h2>
          <p className="mt-1 text-sm text-muted">Episodes watched over time</p>
        </div>
        <RangeToggle value={range} onChange={setRange} />
      </div>
      <ActivityChart points={points} range={range} />
    </section>
  );
}
