"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { MobileTabBar } from "./mobile-tab-bar";
import { MobileTopBar, SiteSidebar } from "./site-sidebar";

export function AppChrome({
  children,
  banner,
  footer
}: {
  children: React.ReactNode;
  banner?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const path = usePathname();
  const admin = path.startsWith("/admin");
  const watch = path.startsWith("/watch");
  const [navOpen, setNavOpen] = useState(false);
  const [theater, setTheater] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);

  useEffect(() => {
    function onTheater(event: Event) {
      setTheater(Boolean((event as CustomEvent).detail));
    }
    window.addEventListener("anemi-theater", onTheater);
    return () => window.removeEventListener("anemi-theater", onTheater);
  }, []);

  if (admin) return <>{children}</>;

  const hideChrome = theater;

  return (
    <div className={hideChrome ? undefined : "pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] xl:pb-0 xl:pl-[var(--sidebar-width)]"}>
      {hideChrome ? null : <SiteSidebar open={navOpen} onClose={closeNav} />}
      {hideChrome ? null : banner}
      {hideChrome ? null : <MobileTopBar onMenu={() => setNavOpen(true)} />}
      {children}
      {hideChrome || watch ? null : footer}
      {hideChrome || watch ? null : <MobileTabBar />}
    </div>
  );
}
