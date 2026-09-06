export type ParsedEpisodeFile = {
  number: number;
  audioKind: "SUB" | "DUB";
  season?: number;
};

export function parseEpisodeFilename(filename: string): ParsedEpisodeFile | null {
  const base = filename.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "");
  if (!base.trim()) return null;
  const dub = /\b(dub|dubbed)\b/i.test(base) || /[\[(_-]dub(?:bed)?[\]\)_-]/i.test(base);
  const audioKind: "SUB" | "DUB" = dub ? "DUB" : "SUB";

  const seasonEpisode = base.match(/s(\d{1,2})\s*e(\d{1,3})/i);
  if (seasonEpisode) {
    return { season: Number(seasonEpisode[1]), number: Number(seasonEpisode[2]), audioKind };
  }
  const xMark = base.match(/(?:^|[^\d])(\d{1,2})\s*x\s*(\d{1,3})(?:[^\d]|$)/i);
  if (xMark) {
    return { season: Number(xMark[1]), number: Number(xMark[2]), audioKind };
  }
  const episodeWord = base.match(/(?:episode|ep|e)[\s._-]*(\d{1,3})/i);
  if (episodeWord) {
    return { number: Number(episodeWord[1]), audioKind };
  }
  const lone = base.match(/(?:^|[^\d])(\d{1,3})(?:[^\d]|$)/);
  if (lone) {
    const number = Number(lone[1]);
    if (number >= 1 && number <= 999) return { number, audioKind };
  }
  return null;
}
