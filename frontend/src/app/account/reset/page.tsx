"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PageIntro } from "@/components/page-intro";
import { useSession } from "@/components/session-provider";
import { api, type Me } from "@/lib/client-api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const session = useSession();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
    setToken(next);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ user: Me }>("/auth/reset", {
        method: "POST",
        body: JSON.stringify({
          token,
          password: String(form.get("password") ?? "")
        })
      });
      session.setUser(result.user);
      router.replace("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="page-shell max-w-lg py-10 pb-16">
      <PageIntro kicker="Account" title="Choose a new password" blurb="This signs you in and ends other sessions." />
      <form onSubmit={(event) => void onSubmit(event)} className="card-panel mt-6 space-y-3 p-4">
        {!token ? <p className="text-sm text-red-400">This reset link is missing a token.</p> : null}
        <input
          name="password"
          type="password"
          required
          minLength={10}
          placeholder="New password (10+ with a letter and a number)"
          className="h-11 w-full rounded-xl bg-elevated px-3 text-sm ring-1 ring-white/10"
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={pending || !token}
          className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {pending ? "Please wait…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
