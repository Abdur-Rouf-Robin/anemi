"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type PlayerMenuItem = {
  id: string;
  label: string;
  hint?: string;
  checked?: boolean;
  disabled?: boolean;
  danger?: boolean;
  keepOpen?: boolean;
  run?: () => void;
  children?: PlayerMenuItem[];
};

export function PlayerContextMenu({
  x,
  y,
  items,
  onClose
}: {
  x: number;
  y: number;
  items: PlayerMenuItem[];
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y, flyLeft: false });

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    const left = Math.max(pad, Math.min(x, window.innerWidth - rect.width - pad));
    const top = Math.max(pad, Math.min(y, window.innerHeight - rect.height - pad));
    setPos({ left, top, flyLeft: left + rect.width + 240 > window.innerWidth });
  }, [x, y]);

  return (
    <div
      ref={root}
      className="fixed z-50 min-w-60 rounded-xl bg-black/92 py-1 text-sm text-white shadow-2xl ring-1 ring-white/15"
      style={{ left: pos.left, top: pos.top }}
      role="menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      <MenuList items={items} onClose={onClose} flyLeft={pos.flyLeft} />
    </div>
  );
}

function MenuList({
  items,
  onClose,
  flyLeft
}: {
  items: PlayerMenuItem[];
  onClose: () => void;
  flyLeft: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const leaveTimer = useRef<number>(0);

  const hasNested = items.some((item) => item.children?.length);

  return (
    <ul className={cn("py-0.5", !hasNested && "max-h-[min(80vh,28rem)] overflow-y-auto")}>
      {items.map((item) => {
        if (item.id.startsWith("sep")) {
          return <li key={item.id} className="my-1 border-t border-white/10" />;
        }
        const nested = Boolean(item.children?.length);
        const shown = open === item.id;
        return (
          <MenuRow
            key={item.id}
            item={item}
            nested={nested}
            shown={shown}
            flyLeft={flyLeft}
            onHover={() => {
              window.clearTimeout(leaveTimer.current);
              if (nested) setOpen(item.id);
            }}
            onLeave={() => {
              if (!nested) return;
              window.clearTimeout(leaveTimer.current);
              leaveTimer.current = window.setTimeout(() => {
                setOpen((id) => (id === item.id ? null : id));
              }, 160);
            }}
            onToggle={() => setOpen(shown ? null : item.id)}
            onClose={onClose}
          />
        );
      })}
    </ul>
  );
}

function MenuRow({
  item,
  nested,
  shown,
  flyLeft,
  onHover,
  onLeave,
  onToggle,
  onClose
}: {
  item: PlayerMenuItem;
  nested: boolean;
  shown: boolean;
  flyLeft: boolean;
  onHover: () => void;
  onLeave: () => void;
  onToggle: () => void;
  onClose: () => void;
}) {
  const row = useRef<HTMLLIElement>(null);
  const [fly, setFly] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!shown || !row.current) return;
    const r = row.current.getBoundingClientRect();
    const width = 228;
    const left = flyLeft ? r.left - width : r.right;
    const top = Math.max(8, Math.min(r.top, window.innerHeight - 320));
    setFly({ top, left: Math.max(8, Math.min(left, window.innerWidth - width - 8)) });
  }, [shown, flyLeft]);

  return (
    <li ref={row} className="relative" onMouseEnter={onHover} onMouseLeave={onLeave}>
      <button
        type="button"
        role="menuitem"
        disabled={item.disabled}
        className={cn(
          "flex w-full items-center gap-2 px-2 py-1.5 text-left disabled:opacity-40",
          item.danger ? "text-red-300 hover:bg-white/10" : "hover:bg-white/10",
          shown && "bg-white/10"
        )}
        onClick={() => {
          if (nested) {
            onToggle();
            return;
          }
          item.run?.();
          if (!item.keepOpen) onClose();
        }}
      >
        <span className={cn("w-4 shrink-0 text-center text-accent", item.checked ? "opacity-100" : "opacity-0")}>✓</span>
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.hint ? <span className="shrink-0 text-[11px] text-white/40">{item.hint}</span> : null}
        {nested ? <span className="shrink-0 text-white/40">›</span> : null}
      </button>
      {nested && shown ? (
        <div
          className="fixed z-[60] min-w-56 rounded-xl bg-black/92 py-1 shadow-2xl ring-1 ring-white/15"
          style={{ top: fly.top, left: fly.left }}
          onMouseEnter={onHover}
        >
          <MenuList items={item.children!} onClose={onClose} flyLeft={flyLeft} />
        </div>
      ) : null}
    </li>
  );
}
