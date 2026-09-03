"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getMe } from "@/lib/client-api";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    getMe()
      .then((data) => {
        const role = data.user?.role;
        if (role !== "ADMIN" && role !== "MODERATOR") {
          router.replace("/account");
          return;
        }
        if (!data.user?.mfaEnabled) {
          router.replace("/account?mfa=required");
          return;
        }
        setOk(true);
      })
      .catch(() => router.replace("/account"));
  }, [router]);

  if (!ok) {
    return (
      <p className="page-shell py-16 text-sm text-muted">Checking access…</p>
    );
  }

  return <>{children}</>;
}
