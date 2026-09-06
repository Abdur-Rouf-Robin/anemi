import { cn } from "@/lib/utils";

export const adminControl =
  "field-input";

export function AdminHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-xl text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card-panel p-4 sm:p-5", className)}>{children}</div>
  );
}

export function Field({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

export function AdminButton({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-accent text-accent-ink hover:opacity-90",
    secondary: "bg-elevated ring-1 ring-white/10 hover:bg-canvas",
    ghost: "text-muted hover:text-ink hover:bg-elevated",
    danger: "text-red-400 hover:bg-red-400/10"
  };
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-50",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminBadge({
  children,
  tone = "muted"
}: {
  children: React.ReactNode;
  tone?: "muted" | "accent" | "ok" | "warn";
}) {
  const styles = {
    muted: "bg-elevated text-muted",
    accent: "bg-accent/15 text-accent",
    ok: "bg-emerald-400/15 text-emerald-300",
    warn: "bg-amber-400/15 text-amber-200"
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize", styles[tone])}>
      {children}
    </span>
  );
}

export function AdminNotice({
  children,
  tone = "error"
}: {
  children: React.ReactNode;
  tone?: "error" | "ok";
}) {
  return (
    <p className={cn("text-sm", tone === "error" ? "text-red-400" : "text-emerald-300")}>{children}</p>
  );
}

export function AdminTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="card-panel overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-4 py-3 text-[11px] font-medium tracking-wide text-muted uppercase", className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}
