"use client";

import { useEffect, useState } from "react";

import { AdminBadge, AdminButton, AdminCard, AdminHeader, AdminNotice, AdminTable, Field, Td, Th, adminControl } from "@/components/admin/ui";
import { AdminOnly } from "@/components/admin-only";
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
    <AdminOnly>
    <main>
      <AdminHeader title="Users" description="Create an account when signup is closed, or promote a member." />
      {error ? <div className="mb-4"><AdminNotice>{error}</AdminNotice></div> : null}
      <AdminCard className="mb-6 max-w-xl">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            void api("/admin/users", {
              method: "POST",
              body: JSON.stringify({
                email: String(data.get("email") ?? ""),
                displayName: String(data.get("displayName") ?? ""),
                password: String(data.get("password") ?? ""),
                role: String(data.get("role") ?? "MEMBER")
              })
            })
              .then(() => {
                form.reset();
                return load();
              })
              .catch((err: Error) => setError(err.message));
          }}
        >
          <Field label="Display name">
            <input name="displayName" required minLength={2} className={adminControl} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required className={adminControl} />
          </Field>
          <Field label="Password">
            <input name="password" type="password" required minLength={10} className={adminControl} placeholder="10+ with a letter and a number" />
          </Field>
          <Field label="Role">
            <select name="role" defaultValue="MEMBER" className={adminControl}>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
          <AdminButton type="submit">Create user</AdminButton>
        </form>
      </AdminCard>
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
    </AdminOnly>
  );
}
