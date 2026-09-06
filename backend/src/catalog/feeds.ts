export type FeedEpisode = {
  episodeId: string;
  number: number;
  name: string;
  audioKind: string;
  airDate?: string | Date | null;
  durationSec?: number | null;
  seasonNumber: number;
  title: { name: string; slug: string; synopsis?: string | null };
};

export function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function icsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function icsFold(line: string) {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return parts.join("\r\n");
}

export function buildLatestRss(origin: string, items: FeedEpisode[]) {
  const site = origin.replace(/\/+$/, "");
  const now = new Date().toUTCString();
  const entries = items
    .map((item) => {
      const link = `${site}/watch/${item.episodeId}`;
      const season = String(item.seasonNumber).padStart(2, "0");
      const number = String(item.number).padStart(2, "0");
      const title = `${item.title.name} — S${season}E${number} ${item.audioKind}`;
      const date = item.airDate ? new Date(item.airDate).toUTCString() : now;
      return `    <item>
      <title>${xmlEscape(title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${date}</pubDate>
      <description>${xmlEscape(item.name)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Anemi — Latest episodes</title>
    <link>${xmlEscape(`${site}/latest`)}</link>
    <description>Newest published episodes on this catalog.</description>
    <lastBuildDate>${now}</lastBuildDate>
${entries}
  </channel>
</rss>
`;
}

export function buildScheduleIcs(origin: string, days: { date: string; items: FeedEpisode[] }[]) {
  const site = origin.replace(/\/+$/, "");
  const stamp = icsDate(new Date());
  const events = days.flatMap((day) =>
    day.items.map((item) => {
      const start = item.airDate ? new Date(item.airDate) : new Date(`${day.date}T12:00:00.000Z`);
      const minutes = Math.max(item.durationSec ?? 0, 30 * 60);
      const end = new Date(start.getTime() + minutes * 1000);
      const summary = `${item.title.name} — E${item.number} ${item.name}`;
      const url = `${site}/watch/${item.episodeId}`;
      return [
        "BEGIN:VEVENT",
        `UID:episode-${item.episodeId}@anemi`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icsDate(start)}`,
        `DTEND:${icsDate(end)}`,
        icsFold(`SUMMARY:${icsEscape(summary)}`),
        icsFold(`URL:${url}`),
        "END:VEVENT"
      ].join("\r\n");
    })
  );

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Anemi//Schedule//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Anemi schedule", ...events, "END:VCALENDAR", ""].join(
    "\r\n"
  );
}
