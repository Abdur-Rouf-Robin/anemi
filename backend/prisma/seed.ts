import { config } from "dotenv";
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { hash } from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { AirSeason, PrismaClient, PublishStatus, Role, TitleStatus, TitleType } from "@prisma/client";

import { artDir, episodeDir } from "../src/media/media.paths";

function art(slug: string) {
  return {
    posterUrl: `/media/art/${slug}.jpg`,
    backdropUrl: `/media/art/${slug}.jpg`
  };
}

function demoScore(slug: string) {
  let hash = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const rating = 71 + ((hash >>> 0) % 23);
  const scoreCount = 180 + ((hash >>> 8) % 340);
  return { scoreCount, scoreSum: Math.round((rating / 10) * scoreCount) };
}

config({ path: resolve(__dirname, "../.env"), override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed (set it in backend/.env)");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

const DEMO_CAPTIONS = `WEBVTT

00:00:00.000 --> 00:00:04.000
Anemi demo playback check.

00:00:04.000 --> 00:00:09.500
This is a generated test pattern, not a licensed title.
`;

function copyDemoArt(slug: string) {
  const dest = join(artDir(), `${slug}.jpg`);
  if (existsSync(dest)) return;
  const existing = join(artDir(), "cmte899c40005b83smiaucm4b.jpg");
  if (existsSync(existing)) {
    copyFileSync(existing, dest);
    return;
  }
  const ok = runFfmpeg(["-y", "-f", "lavfi", "-i", "color=c=0x1d3a4c:s=480x720:d=1", "-frames:v", "1", dest]);
  if (!ok) {
    console.warn("[anemi] could not create demo poster for", slug);
  }
}

function runFfmpeg(args: string[]) {
  for (const bin of ["ffmpeg", "/usr/bin/ffmpeg"]) {
    const made = spawnSync(bin, args, { stdio: "ignore" });
    if (made.status === 0) return true;
    const err = made.error as NodeJS.ErrnoException | undefined;
    if (err?.code === "ENOENT") continue;
  }
  return false;
}

let demoSamplePath: string | null | undefined;

function ensureDemoSample() {
  if (demoSamplePath !== undefined) return demoSamplePath;
  const dir = join(artDir(), "..", "_demo");
  mkdirSync(dir, { recursive: true });
  const sample = join(dir, "sample.mp4");
  if (existsSync(sample) && statSync(sample).size > 20_000) {
    demoSamplePath = sample;
    return sample;
  }
  const ok = runFfmpeg([
    "-y",
    "-f",
    "lavfi",
    "-i",
    "testsrc=duration=10:size=1280x720:rate=24",
    "-f",
    "lavfi",
    "-i",
    "sine=frequency=440:duration=10",
    "-shortest",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    sample
  ]);
  if (!ok || !existsSync(sample) || statSync(sample).size < 20_000) {
    console.warn("[anemi] ffmpeg demo video failed — episodes will stay without video");
    demoSamplePath = null;
    return null;
  }
  demoSamplePath = sample;
  return sample;
}

async function attachDemoPlayback(episodeId: string, keep: { keepVideo: boolean; keepCaptions: boolean }) {
  const sample = ensureDemoSample();
  const dir = episodeDir(episodeId);
  const videoPath = join(dir, "video.mp4");
  const captionPath = join(dir, "captions.vtt");
  const videoReady = existsSync(videoPath) && statSync(videoPath).size > 20_000;
  if (sample && (!keep.keepVideo || !videoReady)) {
    copyFileSync(sample, videoPath);
  }
  if (!keep.keepCaptions || !existsSync(captionPath)) {
    writeFileSync(captionPath, DEMO_CAPTIONS);
  }
  const hasVideo = existsSync(videoPath) && statSync(videoPath).size > 20_000;
  const hasCaptions = existsSync(captionPath);
  await prisma.episode.update({
    where: { id: episodeId },
    data: {
      ...(hasVideo
        ? { videoUrl: `/media/${episodeId}/video.mp4`, encodeStatus: "ready" }
        : {}),
      ...(hasCaptions ? { subtitleUrl: `/media/${episodeId}/captions.vtt` } : {})
    }
  });
}

const GENRES = [
  { slug: "action", name: "Action" },
  { slug: "adventure", name: "Adventure" },
  { slug: "comedy", name: "Comedy" },
  { slug: "drama", name: "Drama" },
  { slug: "fantasy", name: "Fantasy" },
  { slug: "horror", name: "Horror" },
  { slug: "mystery", name: "Mystery" },
  { slug: "romance", name: "Romance" },
  { slug: "scifi", name: "Sci-Fi" },
  { slug: "slice", name: "Slice of life" },
  { slug: "supernatural", name: "Supernatural" },
  { slug: "thriller", name: "Thriller" },
  { slug: "music", name: "Music" },
  { slug: "psychological", name: "Psychological" },
  { slug: "school", name: "School" },
  { slug: "historical", name: "Historical" },
  { slug: "mecha", name: "Mecha" },
  { slug: "sports", name: "Sports" }
];

type SeedTitle = {
  slug: string;
  name: string;
  type: TitleType;
  status: TitleStatus;
  year: number;
  hue: number;
  spotlight?: boolean;
  viewCount: number;
  studio?: string;
  ageRating?: string;
  airSeason?: AirSeason;
  synopsis: string;
  nameJa?: string;
  genres: string[];
  dub?: boolean;
  airOffsetDays?: number;
  seasons: { number: number; episodes: { name: string; durationSec: number; audioKind?: "SUB" | "DUB" }[] }[];
};

const TITLES: SeedTitle[] = [
  {
    slug: "harbor-lights",
    name: "Harbor Lights",
    nameJa: "ハーバーライツ",
    type: "SERIES",
    status: "AIRING",
    year: 2026,
    hue: 38,
    spotlight: true,
    viewCount: 9200,
    studio: "North Pier",
    ageRating: "PG-13",
    airSeason: "SUMMER",
    synopsis: "A night dispatcher in a coastal city starts hearing ships that are not on any chart.",
    dub: true,
    genres: ["mystery", "drama", "supernatural"],
    seasons: [
      {
        number: 1,
        episodes: [
          { name: "The first horn", durationSec: 1420 },
          { name: "Fog bank", durationSec: 1380 },
          { name: "Unlisted berth", durationSec: 1440 },
          { name: "Low tide", durationSec: 1410 },
          { name: "Pilot lights", durationSec: 1395 },
          { name: "Harbor watch", durationSec: 1435 },
          { name: "Dead reckoning", durationSec: 1408 },
          { name: "The Results of Training", durationSec: 1412 }
        ]
      },
      {
        number: 2,
        episodes: [
          { name: "Second watch", durationSec: 1430 },
          { name: "Chart error", durationSec: 1390 }
        ]
      }
    ]
  },
  {
    slug: "paper-kite",
    name: "Paper Kite",
    type: "SERIES",
    status: "COMPLETED",
    year: 2024,
    hue: 200,
    viewCount: 8100,
    studio: "Kite House",
    ageRating: "PG",
    airSeason: "SPRING",
    synopsis: "Two siblings rebuild a festival kite that remembers every wish tied to its tail.",
    genres: ["adventure", "slice", "historical"],
    seasons: [
      {
        number: 1,
        episodes: [
          { name: "String", durationSec: 1320 },
          { name: "Wind", durationSec: 1290 },
          { name: "Sky", durationSec: 1400 }
        ]
      }
    ]
  },
  {
    slug: "glass-garden",
    name: "Glass Garden",
    type: "MOVIE",
    status: "COMPLETED",
    year: 2025,
    hue: 150,
    viewCount: 6400,
    studio: "Orchid Frame",
    ageRating: "PG-13",
    synopsis: "A conservatory that grows memories instead of plants. One visitor comes to forget.",
    genres: ["drama", "scifi", "psychological"],
    seasons: [{ number: 1, episodes: [{ name: "Glass Garden", durationSec: 6120 }] }]
  },
  {
    slug: "night-train",
    name: "Night Train",
    type: "SERIES",
    status: "AIRING",
    year: 2026,
    hue: 280,
    viewCount: 7700,
    studio: "Railmark",
    ageRating: "PG-13",
    airSeason: "SUMMER",
    synopsis: "The last carriage of the midnight express only appears for people who missed a chance.",
    dub: true,
    genres: ["mystery", "adventure", "thriller"],
    seasons: [
      {
        number: 1,
        episodes: [
          { name: "Platform 9", durationSec: 1360 },
          { name: "Ticket without a name", durationSec: 1390 },
          { name: "Next stop", durationSec: 1410 }
        ]
      }
    ]
  },
  {
    slug: "second-light",
    name: "Second Light",
    type: "MOVIE",
    status: "COMPLETED",
    year: 2023,
    hue: 12,
    viewCount: 5100,
    studio: "Lampblack",
    ageRating: "PG-13",
    synopsis: "After a city-wide blackout, the first lamp that turns back on belongs to no one.",
    genres: ["scifi", "drama"],
    seasons: [{ number: 1, episodes: [{ name: "Second Light", durationSec: 5880 }] }]
  },
  {
    slug: "copper-sky",
    name: "Copper Sky",
    type: "SERIES",
    status: "COMPLETED",
    year: 2022,
    hue: 55,
    viewCount: 4300,
    studio: "Dust Wing",
    ageRating: "PG",
    airSeason: "SUMMER",
    synopsis: "Crop-dusters in a desert valley start painting weather that has not happened yet.",
    genres: ["adventure", "slice"],
    seasons: [
      {
        number: 1,
        episodes: [
          { name: "Dust", durationSec: 1280 },
          { name: "Thermals", durationSec: 1310 }
        ]
      }
    ]
  },
  {
    slug: "quiet-frequency",
    name: "Quiet Frequency",
    type: "SERIES",
    status: "AIRING",
    year: 2026,
    hue: 230,
    viewCount: 6900,
    studio: "Campus Wave",
    ageRating: "PG",
    airSeason: "SUMMER",
    synopsis: "A campus radio show receives unsent letters from listeners who have not written yet.",
    dub: true,
    genres: ["mystery", "slice", "school"],
    seasons: [
      {
        number: 1,
        episodes: [
          { name: "Sign on", durationSec: 1340 },
          { name: "Dead air", durationSec: 1370 },
          { name: "Call in", durationSec: 1400 }
        ]
      }
    ]
  },
  {
    slug: "last-ember",
    name: "Last Ember",
    type: "MOVIE",
    status: "COMPLETED",
    year: 2021,
    hue: 18,
    viewCount: 3900,
    studio: "Ash Kiln",
    ageRating: "PG-13",
    synopsis: "The last kiln in a mountain town fires one more pot — and it will not cool.",
    genres: ["drama"],
    seasons: [{ number: 1, episodes: [{ name: "Last Ember", durationSec: 5640 }] }]
  },
  {
    slug: "salt-overture",
    name: "Salt Overture",
    type: "OVA",
    status: "COMPLETED",
    year: 2025,
    hue: 92,
    viewCount: 2100,
    studio: "Tide Score",
    ageRating: "PG",
    synopsis: "A one-night concert on a salt flat that only the tide can hear.",
    genres: ["drama", "romance", "music"],
    seasons: [{ number: 1, episodes: [{ name: "Salt Overture", durationSec: 1680 }] }]
  },
  {
    slug: "blue-ledger",
    name: "Blue Ledger",
    type: "SPECIAL",
    status: "COMPLETED",
    year: 2024,
    hue: 250,
    viewCount: 1800,
    studio: "Ink Office",
    ageRating: "G",
    synopsis: "A recap special that files every missing page from Harbor Lights.",
    genres: ["mystery", "drama"],
    seasons: [{ number: 1, episodes: [{ name: "Filed under fog", durationSec: 1440 }] }]
  },
  {
    slug: "iron-garden",
    name: "Iron Garden",
    type: "SERIES",
    status: "UPCOMING",
    year: 2026,
    hue: 28,
    viewCount: 1200,
    studio: "Forge North",
    ageRating: "PG-13",
    airSeason: "FALL",
    airOffsetDays: 21,
    synopsis: "A botanist inherits a greenhouse that grows tools instead of flowers.",
    genres: ["fantasy", "adventure", "mecha"],
    seasons: [{ number: 1, episodes: [{ name: "First rust", durationSec: 1380 }] }]
  },
  {
    slug: "tide-clock",
    name: "Tide Clock",
    type: "MOVIE",
    status: "UPCOMING",
    year: 2026,
    hue: 205,
    viewCount: 980,
    studio: "North Pier",
    ageRating: "PG",
    airSeason: "FALL",
    airOffsetDays: 35,
    synopsis: "A harbor clock that runs on the tide starts counting days that have not arrived.",
    genres: ["mystery", "drama"],
    seasons: [{ number: 1, episodes: [{ name: "Tide Clock", durationSec: 6120 }] }]
  },
  {
    slug: "paper-harbor",
    name: "Paper Harbor",
    type: "ONA",
    status: "UPCOMING",
    year: 2026,
    hue: 168,
    viewCount: 740,
    studio: "Fold Studio",
    ageRating: "G",
    airSeason: "WINTER",
    airOffsetDays: 49,
    synopsis: "Origami boats launched from a rooftop keep finding a city that is not on any map.",
    genres: ["adventure", "slice"],
    seasons: [{ number: 1, episodes: [{ name: "First fold", durationSec: 1260 }] }]
  }
];

async function main() {
  for (const genre of GENRES) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: { name: genre.name },
      create: genre
    });
  }

  for (const title of TITLES) {
    const existingTitle = await prisma.title.findUnique({ where: { slug: title.slug } });
    const keepPoster = existingTitle?.posterUrl?.startsWith("/media/");
    const keepBackdrop = existingTitle?.backdropUrl?.startsWith("/media/");
    const fallbackArt = art(title.slug);
    const rating = !existingTitle || existingTitle.scoreCount < 80 ? demoScore(title.slug) : null;
    const created = await prisma.title.upsert({
      where: { slug: title.slug },
      update: {
        name: title.name,
        nameJa: title.nameJa ?? null,
        synopsis: title.synopsis,
        type: title.type,
        status: title.status,
        year: title.year,
        hue: title.hue,
        spotlight: title.spotlight ?? false,
        viewCount: title.viewCount,
        studio: title.studio,
        ageRating: title.ageRating,
        airSeason: title.airSeason,
        posterUrl: keepPoster && existingTitle ? existingTitle.posterUrl : fallbackArt.posterUrl,
        backdropUrl: keepBackdrop && existingTitle ? existingTitle.backdropUrl : fallbackArt.backdropUrl,
        publish: PublishStatus.PUBLISHED,
        ...(rating ?? {})
      },
      create: {
        slug: title.slug,
        name: title.name,
        nameJa: title.nameJa ?? null,
        synopsis: title.synopsis,
        type: title.type,
        status: title.status,
        year: title.year,
        hue: title.hue,
        spotlight: title.spotlight ?? false,
        viewCount: title.viewCount,
        studio: title.studio,
        ageRating: title.ageRating,
        airSeason: title.airSeason,
        ...art(title.slug),
        publish: PublishStatus.PUBLISHED,
        ...demoScore(title.slug)
      }
    });
    copyDemoArt(title.slug);

    await prisma.titleGenre.deleteMany({ where: { titleId: created.id } });
    for (const slug of title.genres) {
      const genre = await prisma.genre.findUniqueOrThrow({ where: { slug } });
      await prisma.titleGenre.create({
        data: { titleId: created.id, genreId: genre.id }
      });
    }

    for (const season of title.seasons) {
      const row = await prisma.season.upsert({
        where: { titleId_number: { titleId: created.id, number: season.number } },
        update: {},
        create: { titleId: created.id, number: season.number }
      });
      for (const [index, episode] of season.episodes.entries()) {
        const number = index + 1;
        const airDate =
          title.status === "AIRING"
            ? new Date(Date.now() + (index - 5) * 7 * 24 * 60 * 60 * 1000 + 6 * 24 * 60 * 60 * 1000)
            : title.status === "UPCOMING"
              ? new Date(Date.now() + ((title.airOffsetDays ?? 21) + index * 7) * 24 * 60 * 60 * 1000)
              : new Date(Date.UTC(title.year, 6, 4 + index * 7));
        const kinds: Array<"SUB" | "DUB"> = title.dub ? ["SUB", "DUB"] : ["SUB"];
        for (const audioKind of kinds) {
          const outroStartSec = Math.max(episode.durationSec - 90, 120);
          const existing = await prisma.episode.findUnique({
            where: { seasonId_number_audioKind_language: { seasonId: row.id, number, audioKind, language: "" } }
          });
          const keepVideo = existing?.videoUrl?.startsWith("/media/");
          const keepCaptions = existing?.subtitleUrl?.startsWith("/media/");
          const saved = await prisma.episode.upsert({
            where: { seasonId_number_audioKind_language: { seasonId: row.id, number, audioKind, language: "" } },
            update: {
              name: episode.name,
              durationSec: episode.durationSec,
              publish: PublishStatus.PUBLISHED,
              introStartSec: 40,
              introEndSec: 95,
              outroStartSec,
              audioKind,
              airDate,
              viewCount: existing?.viewCount && existing.viewCount > 0 ? existing.viewCount : 48 + number * 17 + (audioKind === "DUB" ? 4 : 0)
            },
            create: {
              seasonId: row.id,
              number,
              slug: `${title.slug}-s${season.number}e${number}${audioKind === "DUB" ? "-dub" : ""}`,
              name: episode.name,
              durationSec: episode.durationSec,
              publish: PublishStatus.PUBLISHED,
              introStartSec: 40,
              introEndSec: 95,
              outroStartSec,
              videoUrl: null,
              audioKind,
              airDate,
              subtitleUrl: null,
              viewCount: 48 + number * 17 + (audioKind === "DUB" ? 4 : 0)
            }
          });
          await attachDemoPlayback(saved.id, { keepVideo: Boolean(keepVideo), keepCaptions: Boolean(keepCaptions) });
        }
      }
    }
  }

  const adminEmail = "admin@anemi.local";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN },
    create: {
      email: adminEmail,
      displayName: "Admin",
      passwordHash: await hash("AnemiAdmin1!", 12),
      role: Role.ADMIN
    }
  });

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });

  const demoEpisodes = await prisma.episode.findMany({
    where: { season: { title: { slug: { in: ["harbor-lights", "paper-kite", "glass-garden"] } } } },
    select: { id: true, number: true }
  });
  for (const episode of demoEpisodes) {
    const n = await prisma.comment.count({ where: { episodeId: episode.id } });
    if (n > 0) continue;
    const count = 4 + (episode.number % 6);
    await prisma.comment.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        userId: admin.id,
        episodeId: episode.id,
        body: `Demo thread ${i + 1} — playback and comments check.`
      }))
    });
  }

  const existingPost = await prisma.communityPost.findFirst({
    where: { userId: admin.id, title: "Welcome to the board" }
  });
  if (!existingPost) {
    await prisma.communityPost.create({
      data: {
        userId: admin.id,
        category: "updates",
        title: "Welcome to the board",
        body: "Ask for titles, share recs, and report playback issues for files you own or license."
      }
    });
  }

  const sampleTitle = await prisma.title.findFirst({ where: { slug: "harbor-lights" } });
  if (sampleTitle) {
    const recentViews = await prisma.viewEvent.count({
      where: { titleId: sampleTitle.id, createdAt: { gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } }
    });
    if (recentViews < 8) {
      await prisma.viewEvent.createMany({
        data: Array.from({ length: 12 }, (_, i) => ({
          titleId: sampleTitle.id,
          createdAt: new Date(Date.now() - i * 3 * 60 * 60 * 1000)
        }))
      });
    }
  }

  await seedDemoWatchActivity();

  const banner = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  if (!banner) {
    await prisma.siteSetting.create({ data: { id: "default" } });
  } else if (
    banner.announcement === "Summer week: Harbor Lights E4, Night Train, and Quiet Frequency — Sub and Dub."
  ) {
    await prisma.siteSetting.update({
      where: { id: "default" },
      data: { announcement: null, announcementHref: null }
    });
  }

  const requests = [
    {
      name: "Harbor Lights season 3",
      details: "We license S1–S2. Check if S3 is available for this catalog.",
      status: "OPEN" as const
    },
    {
      name: "Paper Kite — festival recut",
      details: "Licensed recut if the studio offers a movie edition.",
      status: "REVIEWING" as const
    },
    {
      name: "Salt Overture live album visual",
      details: "Concert visual we already have rights to. Add as a special.",
      status: "FULFILLED" as const
    }
  ];
  for (const row of requests) {
    const exists = await prisma.titleRequest.findFirst({ where: { name: row.name } });
    if (!exists) {
      await prisma.titleRequest.create({
        data: { ...row, userId: admin.id }
      });
    }
  }

  console.log("[anemi] seed complete");
}

function demoWatchDates(now = new Date()) {
  const dates: Date[] = [];
  for (let ago = 364; ago >= 0; ago -= 1) {
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ago, 16, 20, 0, 0)
    );
    const t = (364 - ago) / 364;
    const wave =
      1.1 +
      3.4 * Math.sin(Math.PI * t) +
      2.6 * Math.sin(Math.PI * 2 * t) +
      1.2 * Math.sin(Math.PI * 4 * t);
    const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6 ? 1.4 : 1;
    const count = Math.max(0, Math.min(9, Math.round(wave * weekend)));
    for (let i = 0; i < count; i += 1) {
      dates.push(new Date(day.getTime() + i * 19 * 60 * 1000));
    }
  }
  return dates;
}

async function seedDemoWatchActivity() {
  const episodes = await prisma.episode.findMany({
    where: { publish: PublishStatus.PUBLISHED },
    select: { id: true },
    take: 80
  });
  if (!episodes.length) return;
  const users = await prisma.user.findMany({ select: { id: true } });
  const dates = demoWatchDates();
  for (const user of users) {
    const existing = await prisma.watchHistory.count({ where: { userId: user.id } });
    if (existing >= 80) continue;
    await prisma.watchHistory.createMany({
      data: dates.map((watchedAt, index) => ({
        userId: user.id,
        episodeId: episodes[index % episodes.length]!.id,
        watchedAt
      }))
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
