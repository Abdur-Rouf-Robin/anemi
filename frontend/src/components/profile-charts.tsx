"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  usePlotArea,
  useXAxisTicks,
  type TooltipContentProps
} from "recharts";

import type { ActivityPoint, ListStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ScoreStack = {
  score: number;
  WATCHING: number;
  COMPLETED: number;
  ON_HOLD: number;
  DROPPED: number;
  PLAN_TO_WATCH: number;
};

const SCORE_SERIES: { key: ListStatus; label: string }[] = [
  { key: "WATCHING", label: "Watching" },
  { key: "COMPLETED", label: "Completed" },
  { key: "ON_HOLD", label: "On Hold" },
  { key: "DROPPED", label: "Dropped" },
  { key: "PLAN_TO_WATCH", label: "Plan to Watch" }
];

const STATUS_FILL: Record<ListStatus, string> = {
  WATCHING: "var(--profile-watching)",
  COMPLETED: "var(--profile-completed)",
  ON_HOLD: "var(--profile-hold)",
  DROPPED: "var(--profile-dropped)",
  PLAN_TO_WATCH: "var(--profile-plan)"
};

function niceNumber(value: number, round: boolean) {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const f = value / 10 ** exp;
  let nf: number;
  if (round) {
    if (f < 1.5) nf = 1;
    else if (f < 3) nf = 2;
    else if (f < 7) nf = 5;
    else nf = 10;
  } else if (f <= 1) nf = 1;
  else if (f <= 2) nf = 2;
  else if (f <= 5) nf = 5;
  else nf = 10;
  return nf * 10 ** exp;
}

function niceTicks(maxValue: number, target = 5, emptyMax = 4) {
  const max = maxValue <= 0 ? emptyMax : maxValue;
  const range = niceNumber(max, false);
  const step = niceNumber(range / Math.max(1, target - 1), true);
  const ticks: number[] = [];
  for (let value = 0; value <= max + step / 2; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  const last = ticks[ticks.length - 1] ?? 0;
  if (last < max) ticks.push(Math.round((last + step) * 1000) / 1000);
  return { ticks, top: ticks[ticks.length - 1] ?? max };
}

function emptyStacks(): ScoreStack[] {
  return Array.from({ length: 10 }, (_, index) => ({
    score: index + 1,
    WATCHING: 0,
    COMPLETED: 0,
    ON_HOLD: 0,
    DROPPED: 0,
    PLAN_TO_WATCH: 0
  }));
}

export function stacksFromScores(scores: number[] | undefined, stacks?: ScoreStack[] | null): ScoreStack[] {
  if (stacks?.length === 10) return stacks;
  const next = emptyStacks();
  (scores ?? []).forEach((count, index) => {
    const row = next[index];
    if (row) row.COMPLETED = count;
  });
  return next;
}

const axisTick = { fill: "var(--color-muted)", fontSize: 11 } as const;
const tooltipWrap = {
  outline: "none",
  zIndex: 30,
  pointerEvents: "none" as const
};

function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-2 text-xs shadow-[0_8px_24px_rgb(17_24_39_/_0.12)] ring-1 ring-line">
      {children}
    </div>
  );
}

function ScoreTracks() {
  const plot = usePlotArea();
  const ticks = useXAxisTicks();
  if (!plot || !ticks?.length) return null;
  const band = plot.width / ticks.length;
  const barW = Math.min(22, band * 0.48);
  return (
    <g pointerEvents="none">
      {ticks.map((tick) => (
        <rect
          key={tick.index}
          x={tick.coordinate - barW / 2}
          y={plot.y}
          width={barW}
          height={plot.height}
          rx={3}
          fill="var(--color-elevated)"
        />
      ))}
    </g>
  );
}

function ActivityTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ActivityPoint | undefined;
  if (!row) return null;
  return (
    <ChartCard>
      <p className="font-medium text-ink">{row.key}</p>
      <p className="mt-1 flex items-center gap-1.5 text-muted">
        <span className="size-2.5 shrink-0 rounded-[2px] bg-ink" />
        Episodes {row.count}
      </p>
    </ChartCard>
  );
}

function ScoreTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ScoreStack | undefined;
  if (!row) return null;
  return (
    <ChartCard>
      <p className="font-medium text-ink">Collection</p>
      <ul className="mt-1.5 min-w-[9.5rem] space-y-1">
        {SCORE_SERIES.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-6 text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: STATUS_FILL[item.key] }} />
              {item.label}
            </span>
            <span className="tabular-nums text-ink">{row[item.key]}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export function ActivityChart({
  points,
  range
}: {
  points: ActivityPoint[];
  range: "daily" | "weekly" | "monthly";
}) {
  const gradientId = useId().replace(/:/g, "");
  const rawMax = Math.max(0, ...points.map((item) => item.count));
  const { ticks, top } = niceTicks(rawMax, 5, 2);
  const interval = range === "daily" ? 4 : range === "weekly" ? 1 : 0;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 12, right: 18, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-ink)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--color-ink)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 4" />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            interval={interval}
            minTickGap={4}
            tickMargin={10}
            padding={{ left: 8, right: 10 }}
          />
          <YAxis
            ticks={ticks}
            domain={[0, top]}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={36}
            tickMargin={8}
            allowDecimals
          />
          <Tooltip
            content={ActivityTooltip}
            shared
            cursor={{
              stroke: "color-mix(in oklch, var(--color-ink) 28%, transparent)",
              strokeWidth: 1,
              strokeDasharray: "0"
            }}
            wrapperStyle={tooltipWrap}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Episodes"
            stroke="var(--color-ink)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: "var(--color-ink)",
              stroke: "none"
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreChart({
  scores,
  stacks
}: {
  scores?: number[];
  stacks?: ScoreStack[] | null;
}) {
  const data = useMemo(() => stacksFromScores(scores, stacks), [scores, stacks]);
  const rawMax = Math.max(
    0,
    ...data.map((row) => row.WATCHING + row.COMPLETED + row.ON_HOLD + row.DROPPED + row.PLAN_TO_WATCH)
  );
  const { ticks, top } = niceTicks(rawMax, 5, 4);

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 2 }} barCategoryGap="32%">
          <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 4" />
          <XAxis dataKey="score" tick={axisTick} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis
            ticks={ticks}
            domain={[0, top]}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={28}
            tickMargin={6}
            allowDecimals={false}
          />
          <Tooltip
            content={ScoreTooltip}
            shared
            cursor={{ fill: "var(--color-ink)", opacity: 0.045 }}
            wrapperStyle={tooltipWrap}
            isAnimationActive={false}
          />
          <ScoreTracks />
          {SCORE_SERIES.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              stackId="score"
              fill={STATUS_FILL[item.key]}
              maxBarSize={22}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RangeToggle({
  value,
  onChange
}: {
  value: "daily" | "weekly" | "monthly";
  onChange: (next: "daily" | "weekly" | "monthly") => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-elevated p-[3px]">
      {(["daily", "weekly", "monthly"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-semibold capitalize",
            value === item ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
