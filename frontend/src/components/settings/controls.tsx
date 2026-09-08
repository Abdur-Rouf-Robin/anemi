"use client";

import { cn } from "@/lib/utils";

export function SettingSection({
  title,
  hint,
  children
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[15px] font-semibold text-zinc-900">{title}</h3>
        {hint ? <p className="mt-0.5 text-sm text-zinc-500">{hint}</p> : null}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function SettingRow({
  title,
  description,
  children,
  hidden,
  danger
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  hidden?: boolean;
  danger?: boolean;
}) {
  if (hidden) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-white px-4 py-3.5",
        danger ? "border-red-200 bg-red-50" : "border-zinc-200"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        {description ? <p className="mt-0.5 text-[13px] leading-snug text-zinc-500">{description}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        checked ? "bg-zinc-900" : "bg-zinc-200"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
          checked && "translate-x-5"
        )}
      />
    </button>
  );
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => {
        const next = Number(event.target.value);
        if (!Number.isFinite(next)) return;
        onChange(Math.min(max, Math.max(min, next)));
      }}
      className="h-9 w-20 rounded-lg border border-zinc-200 bg-white px-2 text-right text-sm text-zinc-900"
    />
  );
}

export function TextField({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full min-w-[12rem] rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900"
    />
  );
}

export function ColorField({
  value,
  fallback,
  onChange
}: {
  value?: string;
  fallback: string;
  onChange: (next: string) => void;
}) {
  const hex = value || fallback;
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={hex}
        onChange={(event) => onChange(event.target.value)}
        className="size-8 cursor-pointer rounded-md border border-zinc-200 bg-white p-0.5"
        aria-label="Color"
      />
      <input
        type="text"
        value={hex}
        onChange={(event) => {
          const next = event.target.value.trim();
          if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next.toLowerCase());
        }}
        className="h-9 w-[6.5rem] rounded-lg border border-zinc-200 bg-white px-2 font-mono text-xs text-zinc-900"
      />
    </div>
  );
}

export function NoteBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-600">{children}</div>;
}

export function SelectField({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 min-w-[8.5rem] rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function CheckField({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-zinc-300"
      />
      {label}
    </label>
  );
}
