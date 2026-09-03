"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PageIntro } from "@/components/page-intro";
import { api, getMe, type Me } from "@/lib/client-api";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [mfaToken, setMfaToken] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);

  async function refresh() {
    const data = await getMe();
    setUser(data.user);
  }

  useEffect(() => {
    refresh().catch(() => setUser(null));
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mfa") === "required") setMfaRequired(true);
      if (params.get("mode") === "signup") setMode("signup");
    }
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      if (mfaToken) {
        const result = await api<{ user: Me }>("/auth/mfa/verify", {
          method: "POST",
          body: JSON.stringify({ mfaToken, code: String(form.get("code") ?? "") })
        });
        setUser(result.user);
        setMfaToken("");
        router.refresh();
        return;
      }
      const path = mode === "login" ? "/auth/login" : "/auth/signup";
      const email = String(form.get("email") ?? "");
      const password = String(form.get("password") ?? "");
      const result = await api<{ user?: Me; mfaRequired?: boolean; mfaToken?: string }>(path, {
        method: "POST",
        body: JSON.stringify(
          mode === "signup"
            ? { email, password, displayName: String(form.get("displayName") ?? "") }
            : { email, password }
        )
      });
      if (result.mfaRequired && result.mfaToken) {
        setMfaToken(result.mfaToken);
        return;
      }
      if (result.user) setUser(result.user);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  }

  async function beginMfa() {
    setError("");
    try {
      setSetup(await api<{ secret: string; otpauthUrl: string }>("/auth/mfa/begin", { method: "POST" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start MFA");
    }
  }

  async function confirmMfa(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/auth/mfa/confirm", {
        method: "POST",
        body: JSON.stringify({ code: String(form.get("code") ?? "") })
      });
      setSetup(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm MFA");
    }
  }

  async function disableMfa(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/auth/mfa/disable", {
        method: "POST",
        body: JSON.stringify({ code: String(form.get("code") ?? "") })
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disable MFA");
    }
  }

  if (user) {
    return (
      <main className="page-shell max-w-lg py-10 pb-16">
        <PageIntro kicker="Account" title={user.displayName} blurb={user.email} />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/library" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">
            Library
          </Link>
          <Link href="/settings" className="rounded-full bg-elevated px-5 py-2 text-sm ring-1 ring-white/10">
            Settings
          </Link>
          {user.role === "ADMIN" || user.role === "MODERATOR" ? (
            <Link href="/admin" className="rounded-full bg-elevated px-5 py-2 text-sm ring-1 ring-white/10">
              Admin
            </Link>
          ) : null}
          <button type="button" onClick={() => void logout()} className="rounded-full px-5 py-2 text-sm text-muted">
            Log out
          </button>
        </div>
        {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
        {mfaRequired && user && !user.mfaEnabled ? (
          <p className="mt-6 rounded-xl bg-elevated px-3 py-2 text-sm ring-1 ring-white/10">
            Turn on two-factor authentication below, then open the CMS.
          </p>
        ) : null}
        <section className="card-panel mt-10 p-4">
          <h2 className="font-medium">Profile</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void api<{ user: Me }>("/auth/me", {
                method: "PATCH",
                body: JSON.stringify({ displayName: String(form.get("displayName") ?? "") })
              })
                .then((result) => {
                  setUser(result.user);
                  setError("");
                })
                .catch((err: Error) => setError(err.message));
            }}
            className="mt-3 flex gap-2"
          >
            <input
              name="displayName"
              defaultValue={user.displayName}
              required
              minLength={2}
              className="h-11 flex-1 rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10"
            />
            <button type="submit" className="rounded-full bg-elevated px-4 text-sm ring-1 ring-white/10">
              Save
            </button>
          </form>
        </section>
        <section className="card-panel mt-4 p-4">
          <h2 className="font-medium">Password</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              void api("/auth/password", {
                method: "POST",
                body: JSON.stringify({
                  currentPassword: String(data.get("currentPassword") ?? ""),
                  nextPassword: String(data.get("nextPassword") ?? "")
                })
              })
                .then(() => {
                  form.reset();
                  setError("");
                })
                .catch((err: Error) => setError(err.message));
            }}
            className="mt-3 space-y-2"
          >
            <input name="currentPassword" type="password" required minLength={8} placeholder="Current password" className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10" />
            <input name="nextPassword" type="password" required minLength={10} placeholder="New password (10+ with a letter and a number)" className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10" />
            <button type="submit" className="rounded-full bg-elevated px-4 py-2 text-sm ring-1 ring-white/10">
              Update password
            </button>
          </form>
        </section>
        <section className="card-panel mt-4 p-4">
          <h2 className="font-medium">Two-factor authentication</h2>
          <p className="mt-1 text-sm text-muted">
            {user.mfaEnabled
              ? "Authenticator app is on."
              : user.role === "ADMIN" || user.role === "MODERATOR"
                ? "Required for CMS access. Set this up before opening /admin."
                : "Optional extra step after password."}
          </p>
          {!user.mfaEnabled && !setup ? (
            <button type="button" onClick={() => void beginMfa()} className="mt-4 rounded-full bg-elevated px-4 py-2 text-sm ring-1 ring-white/10">
              Set up MFA
            </button>
          ) : null}
          {setup ? (
            <form onSubmit={(event) => void confirmMfa(event)} className="mt-4 space-y-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setup.otpauthUrl)}`}
                alt="Scan this QR code in your authenticator app"
                width={180}
                height={180}
                className="rounded-xl bg-white p-2"
              />
              <p className="break-all text-xs text-muted">Secret: {setup.secret}</p>
              <a href={setup.otpauthUrl} className="block text-sm text-accent">
                Open in authenticator
              </a>
              <input name="code" inputMode="numeric" pattern="\d{6}" required placeholder="6-digit code" className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10" />
              <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
                Confirm
              </button>
            </form>
          ) : null}
          {user.mfaEnabled && user.role !== "ADMIN" && user.role !== "MODERATOR" ? (
            <form onSubmit={(event) => void disableMfa(event)} className="mt-4 flex gap-2">
              <input name="code" inputMode="numeric" pattern="\d{6}" required placeholder="Code to turn off" className="h-11 flex-1 rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10" />
              <button type="submit" className="rounded-full px-4 text-sm text-muted">
                Disable
              </button>
            </form>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell max-w-lg py-10 pb-16">
      <PageIntro
        kicker="Account"
        title={mfaToken ? "Authenticator code" : mode === "login" ? "Sign in" : "Create account"}
        blurb={
          mfaToken
            ? "Enter the 6-digit code from your app."
            : mode === "signup"
              ? "Create an account to save progress and lists."
              : "Sign in to continue watching."
        }
      />
      {!mfaToken ? (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={mode === "login" ? "rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink" : "rounded-full bg-elevated px-3 py-1.5 text-sm text-muted"}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={mode === "signup" ? "rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink" : "rounded-full bg-elevated px-3 py-1.5 text-sm text-muted"}
          >
            Sign up
          </button>
        </div>
      ) : null}
      <form onSubmit={(event) => void onSubmit(event)} className="card-panel mt-6 space-y-3 p-4">
        {mfaToken ? (
          <input name="code" inputMode="numeric" pattern="\d{6}" required placeholder="6-digit code" className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10" />
        ) : (
          <>
            {mode === "signup" ? (
              <input name="displayName" required minLength={2} placeholder="Display name" className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10" />
            ) : null}
            <input name="email" type="email" required placeholder="Email" className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10" />
            <input name="password" type="password" required minLength={mode === "signup" ? 10 : 8} placeholder={mode === "signup" ? "Password (10+ with a letter and a number)" : "Password"} className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10" />
          </>
        )}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button type="submit" disabled={pending} className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60">
          {pending ? "Please wait…" : mfaToken ? "Verify" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </main>
  );
}
