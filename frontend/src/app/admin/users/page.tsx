"use client";

import { useEffect, useState } from "react";

import { AdminBadge, AdminHeader, AdminNotice, AdminTable, Td, Th, adminControl } from "@/components/admin/ui";
import { api } from "@/lib/client-api";

type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: "VIEWER" | "MEMBER" | "MODERATOR" | "ADMIN";
  mfaEnabled: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setUsers(await api<AdminUser[]>("/admin/users"));
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  async function setRole(id: string, role: AdminUser["role"]) {
    setError("");
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change role");
    }
  }

  return (
    <main>
      <AdminHeader title="Users" description="Promote a member to admin so they can use this CMS." />
      {error ? <div className="mb-4"><AdminNotice>{error}</AdminNotice></div> : null}
      <AdminTable>
        <thead>
          <tr className="border-b border-line">
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>MFA</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-line">
              <Td className="font-medium">{user.displayName}</Td>
              <Td className="text-muted">{user.email}</Td>
              <Td>
                <select
                  value={user.role}
                  onChange={(event) => void setRole(user.id, event.target.value as AdminUser["role"])}
                  className={`${adminControl} w-auto`}
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="MEMBER">Member</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Td>
              <Td>
                <AdminBadge tone={user.mfaEnabled ? "ok" : "muted"}>{user.mfaEnabled ? "On" : "Off"}</AdminBadge>
              </Td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </main>
  );
}
