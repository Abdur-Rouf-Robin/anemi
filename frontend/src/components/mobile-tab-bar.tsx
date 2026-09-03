"use client";

import { Clapperboard, Home, Library, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/use-locale";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Clapperboard },
  { href: "/library", label: "Library", icon: Library },
  { href: "/account", label: "You", icon: UserRound }
];

export function MobileTabBar() {
  const pathname = usePathname();
  const tx = useT();
  if (pathname.startsWith("/watch") || pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/90 backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                  active ? "text-accent" : "text-muted"
                )}
              >
                <Icon className="size-5" />
                {tx(tab.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
