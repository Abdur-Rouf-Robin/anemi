"use client";

import { usePathname } from "next/navigation";

import { MobileTabBar } from "./mobile-tab-bar";

export function AppChrome({
  children,
  banner,
  header,
  footer
}: {
  children: React.ReactNode;
  banner?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const path = usePathname();
  const admin = path.startsWith("/admin");

  return (
    <div className={admin ? undefined : "pb-16 md:pb-0"}>
      {admin ? null : banner}
      {admin ? null : header}
      {children}
      {admin ? null : footer}
      {admin ? null : <MobileTabBar />}
    </div>
  );
}
