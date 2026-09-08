"use client";

import Link from "next/link";

import { useSession } from "@/components/session-provider";
import { useSettings } from "@/components/settings/settings-provider";

export function AccountMenu() {
  const { user, access } = useSession();
  const { openSettings } = useSettings();
  const staff = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const canSignup = access?.signupMode !== "closed";

  if (user === undefined) {
    return <div className="size-8 rounded-full bg-elevated/80" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5 border-l border-white/10 pl-2.5">
        {canSignup ? (
          <Link href="/account" className="btn btn-ghost">
            Sign in
          </Link>
        ) : null}
        <Link href={canSignup ? "/account?mode=signup" : "/account"} className="btn btn-primary">
          {canSignup ? "Sign up" : "Sign in"}
        </Link>
      </div>
    );
  }

  const label = user.displayName.slice(0, 1).toUpperCase();

  return (
    <details className="relative border-l border-white/10 pl-2.5">
      <summary
        className="flex size-8 cursor-pointer list-none items-center justify-center rounded-full bg-elevated text-xs font-semibold ring-1 ring-white/10"
        aria-label="Account"
      >
        {label}
      </summary>
      <div className="card-panel absolute top-10 right-0 z-50 w-44 p-1.5">
        <Link href="/account" className="block rounded-lg px-2.5 py-1.5 text-sm hover:bg-elevated">
          Account
        </Link>
        <button
          type="button"
          onClick={() => openSettings()}
          className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-elevated"
        >
          Settings
        </button>
        {staff ? (
          <Link href="/admin" className="block rounded-lg px-2.5 py-1.5 text-sm hover:bg-elevated">
            CMS
          </Link>
        ) : null}
      </div>
    </details>
  );
}
