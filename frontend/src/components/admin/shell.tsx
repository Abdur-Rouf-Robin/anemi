"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Clapperboard,
  Flag,
  LayoutDashboard,
  Mail,
  MessagesSquare,
  Settings,
  Tags,
  Users,
  Inbox,
  Film,
  MessageSquareText,
  AtSign,
  House
} from "lucide-react";

import { AccountMenu } from "@/components/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Catalog",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/home", label: "Homepage", icon: House },
      { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
      { href: "/admin/titles", label: "Titles", icon: Clapperboard },
      { href: "/admin/genres", label: "Genres", icon: Tags }
    ]
  },
  {
    label: "Audience",
    items: [
      { href: "/admin/requests", label: "Requests", icon: Inbox },
      { href: "/admin/reports", label: "Reports", icon: Flag },
      { href: "/admin/comments", label: "Comments", icon: MessageSquareText },
      { href: "/admin/community", label: "Community", icon: MessagesSquare },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
      { href: "/admin/contact", label: "Contact", icon: AtSign }
    ]
  },
  {
    label: "System",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/encodes", label: "Encodes", icon: Film },
      { href: "/admin/settings", label: "Site", icon: Settings }
    ]
  }
];

const nav = groups.flatMap((group) => group.items);
const bar = nav.filter((item) =>
  ["/admin", "/admin/home", "/admin/titles", "/admin/schedule", "/admin/settings"].includes(item.href)
);
const more = nav.filter((item) => !bar.some((link) => link.href === item.href));

function isActive(path: string, item: (typeof nav)[number]) {
  return item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
}

function AdminTitleSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 1) {
      setItems([]);
      return;
    }
    const handle = window.setTimeout(() => {
      api<{ id: string; name: string }[]>("/admin/titles")
        .then((list) =>
          setItems(
            list.filter((title) => title.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8)
          )
        )
        .catch(() => setItems([]));
    }, 160);
    return () => window.clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={box} className="relative mx-auto hidden w-full max-w-xs md:block">
      <input
        value={q}
        onChange={(event) => {
          setQ(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search titles"
        className="h-10 w-full rounded-2xl bg-elevated/80 px-3.5 text-sm ring-1 ring-white/10 backdrop-blur-sm placeholder:text-muted/70 focus:ring-accent/60"
        aria-label="Search CMS titles"
      />
      {open && items.length ? (
        <ul className="card-panel absolute top-11 z-50 w-full overflow-hidden py-1">
          {items.map((title) => (
            <li key={title.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-elevated"
                onClick={() => {
                  router.push(`/admin/titles/${title.id}`);
                  setQ("");
                  setOpen(false);
                }}
              >
                {title.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const moreOpen = more.some((item) => isActive(path, item));

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-white/6 bg-canvas/75 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-ink shadow-[0_8px_20px_color-mix(in_oklch,var(--color-accent)_45%,transparent)]">
              A
            </span>
            <span className="text-[17px] font-semibold tracking-tight">
              anemi <span className="font-medium text-muted">CMS</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-muted xl:flex" aria-label="CMS">
            {bar.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn("hover:text-ink", isActive(path, item) && "text-accent")}
              >
                {item.label}
              </Link>
            ))}
            <details className="relative">
              <summary className={cn("cursor-pointer list-none hover:text-ink", moreOpen && "text-accent")}>
                More
              </summary>
              <div className="card-panel absolute top-8 left-0 z-40 w-44 p-2">
                {more.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-lg px-2 py-1.5 text-sm hover:bg-elevated hover:text-ink",
                      isActive(path, item) && "text-accent"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          </nav>
          <AdminTitleSearch />
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/"
              className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-elevated hover:text-ink"
            >
              View site
            </Link>
            <ThemeToggle />
            <AccountMenu />
          </div>
        </div>
        <nav className="no-scrollbar flex gap-2 overflow-x-auto border-t border-white/6 px-4 py-2 sm:px-6 xl:hidden" aria-label="CMS sections">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-sm ring-1 ring-white/10",
                isActive(path, item) ? "chip-on" : "bg-elevated text-muted hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex">
        <aside className="sticky top-[7rem] hidden h-[calc(100dvh-7rem)] w-60 shrink-0 flex-col border-r border-white/6 bg-surface/40 backdrop-blur-xl lg:flex xl:top-16 xl:h-[calc(100dvh-4rem)]">
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="CMS sidebar">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="px-2 pb-2 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{group.label}</p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(path, item);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm",
                            active
                              ? "bg-accent/15 text-ink ring-1 ring-accent/25"
                              : "text-muted hover:bg-elevated/60 hover:text-ink"
                          )}
                        >
                          <Icon className={cn("size-4 opacity-80", active && "text-accent")} />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="border-t border-white/6 p-4">
            <Link href="/" className="block rounded-xl px-2.5 py-2 text-sm text-muted hover:bg-elevated hover:text-ink">
              View public site
            </Link>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="page-shell py-8 sm:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
