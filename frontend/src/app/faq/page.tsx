import type { Metadata } from "next";

import { FaqList, type FaqGroup } from "@/components/faq-list";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "FAQ" };

const GROUPS: FaqGroup[] = [
  {
    heading: "Before you ask for help",
    items: [
      {
        q: "General guidelines",
        a: "Clear the browser cache, try Chrome or Firefox, and make sure you are signed in if a feature needs an account. Anemi only plays files this site hosts — it does not pull streams from other websites."
      }
    ]
  },
  {
    heading: "Stream Issues",
    items: [
      {
        q: "Video won't load, shows infinite loading or a black screen",
        a: "Refresh once, then try another quality from the player menu. If it still fails, the file may still be encoding — check again later or ask staff from Contact."
      },
      {
        q: "Video buffers constantly despite fast internet",
        a: "Lower the quality, pause to let the buffer fill, and close other tabs using the network. Progressive loading can be toggled in Settings → Player."
      },
      {
        q: "Green, blue, or red picture instead of a normal image",
        a: "That is usually a codec or GPU decode glitch. Switch quality, turn hardware decode off in the browser, or try another browser."
      }
    ]
  },
  {
    heading: "Account problems",
    items: [
      {
        q: "Registrations are throttled or closed",
        a: "Staff can limit signups. If the site is invite-only, you need a code. Password resets need email to be configured by the operator."
      },
      {
        q: "I can't change my username",
        a: "Display name is edited on your Profile page or in Settings → Account. Names that impersonate staff or use blocked words will not save."
      },
      {
        q: "I can't comment on episodes",
        a: "Comments can be turned off per title, or your account may be new. Sign in and try again after staff publish the episode."
      }
    ]
  },
  {
    heading: "Subtitles",
    items: [
      {
        q: "Subtitles aren't showing",
        a: "Open the player captions menu and pick a track. Enable subtitles in Settings → Subtitles. Not every file has a caption attached."
      }
    ]
  },
  {
    heading: "Site & Browser",
    items: [
      {
        q: "Safari issues",
        a: "Some codecs and fullscreen behavior are limited on Safari and iOS. Chrome or Firefox on desktop is the most reliable player."
      },
      {
        q: "A title has no episodes",
        a: "Staff add licensed files in the CMS. Request the series from the sidebar if it should be in this catalog."
      }
    ]
  },
  {
    heading: "Episode status",
    items: [
      {
        q: "What do the colored dots mean?",
        a: "Ready means a playable file is published. Encoding means staff are still processing it. Missing means there is no file yet."
      },
      {
        q: "What are Filler and Recap episodes?",
        a: "Staff can mark extras as filler or recap. You can hide those from episode lists in Settings → Site."
      }
    ]
  }
];

export default function FaqPage() {
  return (
    <main className="page-shell max-w-3xl py-8 pb-16 xl:py-10">
      <PageHeader title="FAQ" blurb="Common issues and how to fix them." />
      <FaqList groups={GROUPS} />
      <p className="mt-10 text-sm text-muted">
        Still stuck? Use <a href="/contact" className="font-medium text-ink underline-offset-2 hover:underline">Contact</a> or{" "}
        <a href="/community" className="font-medium text-ink underline-offset-2 hover:underline">Community</a>.
      </p>
    </main>
  );
}
