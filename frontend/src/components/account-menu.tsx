"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getMe, type Me } from "@/lib/client-api";

export function AccountMenu() {
  const [user, setUser] = useState<Me | null | undefined>(undefined);

  useEffect(() => {
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const staff = user?.role === "ADMIN" || user?.role === "MODERATOR";

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/account" className="hidden text-sm font-medium text-muted hover:text-ink sm:inline">
          Sign in
        </Link>
        <Link
          href="/account?mode=signup"
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-ink"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const label = user.displayName.slice(0, 1).toUpperCase();

  return (
    <details className="relative">
      <summary
        className="flex size-8 cursor-pointer list-none items-center justify-center rounded-full bg-elevated text-xs font-medium ring-1 ring-white/10"
        aria-label="Account"
      >
        {label}
      </summary>
      <div className="card-panel absolute top-10 right-0 z-50 w-40 p-1.5">
        <Link href="/account" className="block rounded-lg px-2.5 py-1.5 text-sm hover:bg-elevated">
          Account
        </Link>
        <Link href="/settings" className="block rounded-lg px-2.5 py-1.5 text-sm hover:bg-elevated">
          Settings
        </Link>
        {staff ? (
          <Link href="/admin" className="block rounded-lg px-2.5 py-1.5 text-sm hover:bg-elevated">
            CMS
          </Link>
        ) : null}
      </div>
    </details>
  );
}
