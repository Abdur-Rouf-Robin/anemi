"use client";

import { useEffect, useState } from "react";

import { ProfileDashboard } from "@/components/profile-dashboard";
import { usePrefs } from "@/components/settings/settings-provider";
import { api, type Me } from "@/lib/client-api";
import type { ProfileStats } from "@/lib/types";

export function ProfileHome({ user }: { user: Me }) {
  const prefs = usePrefs();
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    void api<ProfileStats>("/library/stats")
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <ProfileDashboard
      person={{
        id: user.id,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
        avatar: prefs.profileAvatar,
        hue: prefs.profileHue
      }}
      stats={stats}
      mine
      publicHref={`/u/${user.id}`}
    />
  );
}
