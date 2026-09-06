"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/client-api";

export function ClearHistory() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className="text-xs text-muted hover:text-ink disabled:opacity-60"
      onClick={() => {
        if (!confirm("Clear watch history and resume points on this account?")) return;
        setPending(true);
        void api("/library/history", { method: "DELETE" })
          .then(() => router.refresh())
          .finally(() => setPending(false));
      }}
    >
      {pending ? "Clearing…" : "Clear history"}
    </button>
  );
}
