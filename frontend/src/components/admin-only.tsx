"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSession } from "@/components/session-provider";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useSession();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (user === undefined) return;
    if (user?.role !== "ADMIN") {
      router.replace("/admin");
      return;
    }
    setOk(true);
  }, [router, user]);

  if (!ok) {
    return <p className="page-shell py-16 text-sm text-muted">Checking access…</p>;
  }

  return <>{children}</>;
}
