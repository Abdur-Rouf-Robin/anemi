import { LegalPage } from "../legal/page-shell";

export default function FaqPage() {
  return (
    <LegalPage
      title="FAQ"
      body={[
        "What is Anemi? A catalog and player for video files you own or license. Search, open a title, and play. It is not a scrape of other websites and does not embed third-party stream servers.",
        "How do I watch? Open a title, pick an episode from the number grid or list, and hit play. Use Sub or Dub filters when both exist. Prev and Next move through the season.",
        "Player controls: skip intro uses the intro end time set on the episode. Auto play, auto next, and skip intro live in Settings and stay with your account.",
        "Lists: Watching, Plan to watch, On hold, Dropped, and Completed work like a standard tracker. You can export JSON or import an AniList username / JSON export from Library.",
        "Watch together creates a room around one episode. The host clock is the source of truth; guests stay in sync and can chat live.",
        "Schedule, A–Z, Latest, Random, Discover, and Top 10 charts cover the same catalog surfaces you would expect on a streaming home.",
        "Request a title if something you license is missing. Staff review requests in the admin CMS and mark them fulfilled or declined.",
        "Comments support spoilers, replies, and reports. Moderators clear reports from the admin panel.",
        "Newsletter signup is in the footer. Theme (dark/light) and language live in Settings and the header toggle.",
        "Legal: Terms, Privacy, and DMCA are in the footer. Contact us if you need a title taken down or have a licensing question."
      ]}
    />
  );
}
