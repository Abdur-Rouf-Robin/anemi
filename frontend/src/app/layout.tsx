import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { AnnouncementBanner } from "@/components/announcement-banner";
import { AppChrome } from "@/components/app-chrome";
import { CommandPalette } from "@/components/command-palette";
import { ShortcutsHelp } from "@/components/shortcuts-help";
import { LocaleProvider } from "@/components/locale-provider";
import { SentryInit } from "@/components/sentry-init";
import { SettingsModal } from "@/components/settings/settings-modal";
import { SettingsProvider } from "@/components/settings/settings-provider";
import { SiteFooter } from "@/components/site-footer";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getAnnouncement, getGenres } from "@/lib/api";
import { cookies } from "next/headers";
import { Suspense } from "react";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e8f1f7"
};

export const metadata: Metadata = {
  title: { default: "Anemi", template: "%s · Anemi" },
  description: "Search, tap, watch. A catalog for video you own or license.",
  applicationName: "Anemi",
  appleWebApp: {
    capable: true,
    title: "Anemi",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg"
  },
  openGraph: {
    siteName: "Anemi",
    type: "website"
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const announcement = await getAnnouncement();
  const genres = await getGenres();
  const locale = (await cookies()).get("anemi_locale")?.value === "jp" ? "jp" : "en";

  return (
    <html lang={locale === "jp" ? "ja" : "en"} className={`${geist.variable} light`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var flagged=localStorage.getItem("anemi-chrome-light");var t=localStorage.getItem("anemi-theme");if(flagged==="1"&&t==="dark"){document.documentElement.classList.remove("light");document.documentElement.style.colorScheme="dark"}else{document.documentElement.classList.add("light");document.documentElement.style.colorScheme="light"}}catch(e){document.documentElement.classList.add("light");document.documentElement.style.colorScheme="light"}})();`
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <SentryInit />
        <SessionProvider>
        <SettingsProvider>
        <ThemeProvider />
        <LocaleProvider initial={locale} />
        <Suspense>
          <CommandPalette />
        </Suspense>
        <ShortcutsHelp />
        <AppChrome
          banner={
            <AnnouncementBanner
              announcement={announcement?.announcement}
              href={announcement?.announcementHref}
            />
          }
          footer={<SiteFooter genres={genres} />}
        >
          {children}
        </AppChrome>
        <SettingsModal />
        </SettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
