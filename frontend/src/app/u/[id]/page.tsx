"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ProfileDashboard } from "@/components/profile-dashboard";
import { api } from "@/lib/client-api";
import type { PublicProfile } from "@/lib/types";

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setMissing(false);
    void api<PublicProfile>(`/library/profile/${id}`)
      .then(setProfile)
      .catch(() => {
        setProfile(null);
        setMissing(true);
      });
  }, [id]);

  if (missing) {
    return (
      <main className="page-shell py-16">
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <p className="mt-2 text-sm text-muted">That account is not on this catalog.</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="page-shell py-16">
        <p className="text-sm text-muted">Loading profile…</p>
      </main>
    );
  }

  if (profile.private) {
    return (
      <main className="page-shell py-16">
        <h1 className="text-2xl font-bold">{profile.user.displayName}</h1>
        <p className="mt-2 text-sm text-muted">This profile is private.</p>
      </main>
    );
  }

  return <ProfileDashboard person={profile.user} stats={profile.stats} mine={profile.mine} visibility={profile.visibility} />;
}
