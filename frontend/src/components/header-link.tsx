"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function HeaderLink({
  href,
  children,
  exact
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} data-active={active ? "true" : "false"} className={cn("nav-underline hover:text-ink", active ? "text-ink" : "text-muted")}>
      {children}
    </Link>
  );
}
