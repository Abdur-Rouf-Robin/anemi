import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/shell";
import { getSessionUser } from "@/lib/api";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  const user = session?.user;
  const staff = user?.role === "ADMIN" || user?.role === "MODERATOR";
  if (!user || !staff) redirect("/account");
  if (!user.mfaEnabled) redirect("/account?mfa=required");

  return <AdminShell>{children}</AdminShell>;
}
