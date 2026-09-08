"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileHome } from "./profile-home";
import { MfaQr } from "@/components/mfa-qr";
import { useSession } from "@/components/session-provider";
import { api, type Me } from "@/lib/client-api";

export default function AccountPage() {
  const router = useRouter();
  const session = useSession();
  const user = session.user;
  const access = session.access;
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [inviteCode, setInviteCode] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string; setupToken: string } | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);

  async function refresh() {
    await session.refresh();
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mfa") === "required") setMfaRequired(true);
      if (params.get("mode") === "signup") setMode("signup");
      if (params.get("mode") === "forgot") setMode("forgot");
      const invite = params.get("invite")?.trim();
      if (invite) {
        setInviteCode(invite);
        setMode("signup");
      }
    }
  }, []);

  useEffect(() => {
    if (access?.signupMode === "closed" && (mode === "signup" || mode === "forgot")) {
      setMode("login");
    }
  }, [access, mode]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNote("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      if (mfaToken) {
        const result = await api<{ user: Me }>("/auth/mfa/verify", {
          method: "POST",
          body: JSON.stringify({ mfaToken, code: String(form.get("code") ?? "") })
        });
        session.setUser(result.user);
        setMfaToken("");
        router.refresh();
        return;
      }
      if (mode === "forgot") {
        await api("/auth/forgot", {
          method: "POST",
          body: JSON.stringify({ email: String(form.get("email") ?? "") })
        });
        setNote("If that account exists, a reset link is on the way.");
        return;
      }
      const signupAllowed = access?.signupMode !== "closed";
      const path = mode === "signup" && signupAllowed ? "/auth/signup" : "/auth/login";
      const email = String(form.get("email") ?? "");
      const password = String(form.get("password") ?? "");
      const result = await api<{ user?: Me; mfaRequired?: boolean; mfaToken?: string }>(path, {
        method: "POST",
        body: JSON.stringify(
          path === "/auth/signup"
            ? {
                email,
                password,
                displayName: String(form.get("displayName") ?? ""),
                inviteCode: inviteCode || undefined
              }
            : { email, password }
        )
      });
      if (result.mfaRequired && result.mfaToken) {
        setMfaToken(result.mfaToken);
        return;
      }
      if (result.user) session.setUser(result.user);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setPending(false);
    }
  }

  async function beginMfa() {
    setError("");
    try {
      setSetup(await api<{ secret: string; otpauthUrl: string; setupToken: string }>("/auth/mfa/begin", { method: "POST" }));
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
        body: JSON.stringify({ code: String(form.get("code") ?? ""), setupToken: setup?.setupToken })
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

  if (user === undefined) {
    return (
      <main className="page-shell max-w-lg py-10 pb-16">
        <p className="text-sm text-muted">Loading account…</p>
      </main>
    );
  }

  if (user) {
    return (
      <>
        {mfaRequired && !user.mfaEnabled ? (
          <p className="page-shell pt-6 text-sm text-muted">Turn on two-factor authentication in Settings before opening the CMS.</p>
        ) : null}
        <ProfileHome user={user} />
        <div className="page-shell max-w-lg pb-16">
          <details className="card-panel p-4">
            <summary className="cursor-pointer font-medium">Account security</summary>
            {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
            <section className="mt-4">
              <h2 className="text-sm font-medium">Password</h2>
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
                <input name="currentPassword" type="password" required minLength={8} placeholder="Current password" className="field-input" />
                <input name="nextPassword" type="password" required minLength={10} placeholder="New password (10+ with a letter and a number)" className="field-input" />
                <button type="submit" className="filter-btn">
                  Update password
                </button>
              </form>
            </section>
            <section className="mt-6">
              <h2 className="text-sm font-medium">Two-factor authentication</h2>
              <p className="mt-1 text-sm text-muted">
                {user.mfaEnabled
                  ? "Authenticator app is on."
                  : user.role === "ADMIN" || user.role === "MODERATOR"
                    ? "Required for CMS access."
                    : "Optional extra step after password."}
              </p>
              {!user.mfaEnabled && !setup ? (
                <button type="button" onClick={() => void beginMfa()} className="filter-btn mt-3">
                  Set up MFA
                </button>
              ) : null}
              {setup ? (
                <form onSubmit={(event) => void confirmMfa(event)} className="mt-4 space-y-3">
                  <MfaQr otpauthUrl={setup.otpauthUrl} />
                  <p className="break-all text-xs text-muted">Secret: {setup.secret}</p>
                  <input name="code" inputMode="numeric" pattern="\d{6}" required placeholder="6-digit code" className="field-input" />
                  <button type="submit" className="hero-cta h-10 px-4 text-sm font-semibold">
                    Confirm
                  </button>
                </form>
              ) : null}
              {user.mfaEnabled && user.role !== "ADMIN" && user.role !== "MODERATOR" ? (
                <form onSubmit={(event) => void disableMfa(event)} className="mt-4 flex gap-2">
                  <input name="code" inputMode="numeric" pattern="\d{6}" required placeholder="Code to turn off" className="field-input flex-1" />
                  <button type="submit" className="filter-btn">
                    Disable
                  </button>
                </form>
              ) : null}
            </section>
          </details>
        </div>
      </>
    );
  }

  const signupMode = access?.signupMode ?? "invite";
  const canSignup = signupMode !== "closed";
  const formMode = !canSignup && mode === "signup" ? "login" : mode;

  return (
    <main className="page-shell flex max-w-lg justify-center py-10 pb-16 sm:py-16">
      <div className="w-full">
        <div className="mb-6 text-center">
          <p className="section-kicker">Account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {mfaToken
              ? "Authenticator code"
              : formMode === "login"
                ? "Welcome back"
                : formMode === "forgot"
                  ? "Reset password"
                  : "Create Account"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {mfaToken
              ? "Enter the 6-digit code from your app."
              : formMode === "signup"
                ? signupMode === "invite"
                  ? "You need an invite code from staff."
                  : "Choose how you'd like to create your account"
                : formMode === "forgot"
                  ? access?.resetEnabled
                    ? "We will email a reset link if that account exists."
                    : "Ask a site admin to reset your password. SMTP is not set."
                  : "Login to your account to continue"}
          </p>
        </div>
        <div className="card-panel p-5 sm:p-6">
          {!mfaToken && canSignup ? (
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-elevated/80 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={formMode === "login" ? "btn btn-primary w-full" : "btn w-full text-muted"}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={formMode === "signup" ? "btn btn-primary w-full" : "btn w-full text-muted"}
              >
                Sign up
              </button>
            </div>
          ) : null}
          <form onSubmit={(event) => void onSubmit(event)} className="space-y-3">
            {mfaToken ? (
              <input name="code" inputMode="numeric" pattern="\d{6}" required placeholder="6-digit code" className="field-input" />
            ) : (
              <>
                {formMode === "signup" ? (
                  <input name="displayName" required minLength={2} placeholder="Display name" className="field-input" />
                ) : null}
                <input name="email" type="email" required placeholder="Email" className="field-input" />
                {formMode === "signup" && signupMode === "invite" ? (
                  <input
                    name="inviteCode"
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    required
                    placeholder="Invite code"
                    className="field-input"
                  />
                ) : null}
                {formMode !== "forgot" ? (
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={formMode === "signup" ? 10 : 8}
                    placeholder={formMode === "signup" ? "Password (10+ with a letter and a number)" : "Password"}
                    className="field-input"
                  />
                ) : null}
              </>
            )}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {note ? <p className="text-sm text-muted">{note}</p> : null}
            <button
              type="submit"
              disabled={pending || (formMode === "forgot" && access && !access.resetEnabled)}
              className="btn btn-primary btn-lg w-full"
            >
              {pending
                ? "Please wait…"
                : mfaToken
                  ? "Verify"
                  : formMode === "login"
                    ? "Sign in"
                    : formMode === "forgot"
                      ? "Send reset link"
                      : "Create account"}
            </button>
          </form>
          {!mfaToken && formMode === "login" ? (
            <button type="button" onClick={() => setMode("forgot")} className="mt-4 w-full text-center text-sm text-muted hover:text-ink">
              Forgot password
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
