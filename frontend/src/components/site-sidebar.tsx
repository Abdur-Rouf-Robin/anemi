"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Bookmark,
  CalendarDays,
  CircleHelp,
  Clock,
  Compass,
  Eye,
  FileText,
  List,
  Plus,
  Rss,
  Scale,
  Settings,
  Shuffle,
  BookOpen,
  UserRound
} from "lucide-react";

import { SearchBox } from "@/components/search-box";
import { useSession } from "@/components/session-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSettings } from "@/components/settings/settings-provider";
import { useT } from "@/lib/use-locale";
import { initials, truncateName } from "@/lib/user-settings";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "",
    items: [
      { href: "/browse", label: "Browse", icon: BookOpen },
      { href: "/discover", label: "Discover", icon: Compass },
      { href: "/random", label: "Random", icon: Shuffle },
      { href: "/latest", label: "Latest Episodes", icon: Clock },
      { href: "/schedule", label: "Schedule", icon: CalendarDays }
    ]
  },
  {
    label: "Personal",
    items: [
      { href: "/account", label: "Profile", icon: UserRound },
      { href: "/library", label: "Collection", icon: Bookmark },
      { href: "/library/playlists", label: "Lists", icon: List },
      { href: "/notifications", label: "Updates", icon: Rss },
      { href: "/history", label: "Watch History", icon: Eye }
    ]
  },
  {
    label: "Misc",
    items: [
      { href: "/faq", label: "FAQ", icon: CircleHelp },
      { href: "/terms", label: "Terms of Service", icon: Scale },
      { href: "/privacy", label: "Privacy Policy", icon: FileText }
    ]
  }
];

function navActive(pathname: string, href: string, exact?: boolean) {
  const path = href.split("#")[0] ?? href;
  if (exact) return pathname === path;
  if (path === "/account") return pathname === "/account" || pathname.startsWith("/u/");
  if (path === "/library") return pathname === "/library";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function SiteSidebar({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, access } = useSession();
  const { openSettings } = useSettings();
  const tx = useT();
  const canSignup = access?.signupMode !== "closed";
  const staff = user?.role === "ADMIN" || user?.role === "MODERATOR";

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      event.preventDefault();
      document.getElementById("anemi-sidebar-search")?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        className={cn("scrim fixed inset-0 z-40 xl:hidden", open ? "block" : "hidden")}
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        className={cn(
          "site-sidebar fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col pt-[env(safe-area-inset-top,0px)] transition-transform xl:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
        )}
      >
        <div className="site-sidebar-panel flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
            <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={onClose}>
              <span className="brand-mark grid size-8 shrink-0 place-items-center rounded-lg text-[13px] font-bold">A</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">Anemi</span>
                <span className="block text-[11px] text-[var(--sidebar-muted)]">Platform</span>
              </span>
            </Link>
          </div>
          <div className="px-3 pb-3">
            <SearchBox variant="sidebar" />
          </div>
          <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-3" aria-label="Site">
            {groups.map((group) => (
              <div key={group.label || "main"}>
                {group.label ? (
                  <p className="px-2.5 pb-1 text-[10px] font-semibold tracking-[0.16em] text-[var(--sidebar-muted)] uppercase">{tx(group.label)}</p>
                ) : null}
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = navActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn("nav-link flex items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 text-sm", active && "nav-link-active font-medium")}
                        >
                          <Icon className="size-4 shrink-0" />
                          {tx(item.label)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {staff ? (
              <Link href="/admin" className="nav-link flex items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 text-sm">
                <Settings className="size-4" />
                CMS
              </Link>
            ) : null}
          </nav>
          <div className="mt-auto space-y-2 border-t border-line p-3">
            <Link href="/request" className="sidebar-request flex items-center justify-between rounded-[var(--radius-control)] px-2.5 py-2 text-sm">
              {tx("Request Series")}
              <Plus className="size-4" />
            </Link>
            {user ? (
              <div className="flex items-center gap-2 rounded-xl bg-[var(--avatar-bg)] px-2 py-2">
                <div className="avatar-mark grid size-9 shrink-0 place-items-center rounded-full text-[10px] font-bold">
                  {initials(user.displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{truncateName(user.displayName)}</p>
                  <p className="text-[11px] text-[var(--sidebar-muted)]">{staff ? "Staff" : "Registered"}</p>
                </div>
                <ThemeToggle />
                <button type="button" className="icon-btn" aria-label="Settings" onClick={() => openSettings()}>
                  <Settings className="size-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-[var(--avatar-bg)] px-2 py-2">
                <Link href={canSignup ? "/account?mode=signup" : "/account"} className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="avatar-mark grid size-9 place-items-center rounded-full text-xs font-semibold">G</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Guest</p>
                    <p className="text-[11px] text-[var(--sidebar-muted)]">N/A</p>
                  </div>
                </Link>
                <ThemeToggle />
                <button type="button" className="icon-btn" aria-label="Settings" onClick={() => openSettings()}>
                  <Settings className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  const { openSettings } = useSettings();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-canvas/90 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] backdrop-blur-xl xl:hidden">
      <button type="button" className="icon-btn" aria-label="Open menu" onClick={onMenu}>
        <span className="brand-mark grid size-8 place-items-center rounded-lg text-[13px] font-bold">A</span>
      </button>
      <div className="min-w-0 flex-1">
        <SearchBox variant="compact" />
      </div>
      <button type="button" className="icon-btn" aria-label="Settings" onClick={() => openSettings()}>
        <Settings className="size-4" />
      </button>
    </header>
  );
}
