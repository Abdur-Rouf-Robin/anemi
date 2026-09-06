import { config } from "dotenv";
import { resolve } from "node:path";
import { hash } from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { AirSeason, PrismaClient, PublishStatus, Role, TitleStatus, TitleType } from "@prisma/client";

function art(slug: string) {
  return {
    posterUrl: `/posters/${slug}.jpg`,
    backdropUrl: `/posters/${slug}.jpg`
  };
}

config({ path: resolve(__dirname, "../.env"), override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed (set it in backend/.env)");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

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
  genres: string[];
  dub?: boolean;
  airOffsetDays?: number;
  seasons: { number: number; episodes: { name: string; durationSec: number; audioKind?: "SUB" | "DUB" }[] }[];
};

const TITLES: SeedTitle[] = [
  {
    slug: "harbor-lights",
    name: "Harbor Lights",
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
          { name: "Low tide", durationSec: 1410 }
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
    const created = await prisma.title.upsert({
      where: { slug: title.slug },
      update: {
        name: title.name,
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
        publish: PublishStatus.PUBLISHED
      },
      create: {
        slug: title.slug,
        name: title.name,
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
        publish: PublishStatus.PUBLISHED
      }
    });

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
            ? new Date(Date.now() + (index - 1) * 7 * 24 * 60 * 60 * 1000)
            : title.status === "UPCOMING"
              ? new Date(Date.now() + ((title.airOffsetDays ?? 21) + index * 7) * 24 * 60 * 60 * 1000)
              : new Date(Date.UTC(title.year, 6, 4 + index * 7));
        const kinds: Array<"SUB" | "DUB"> = title.dub ? ["SUB", "DUB"] : ["SUB"];
        for (const audioKind of kinds) {
          const outroStartSec = Math.max(episode.durationSec - 90, 120);
          const demoCaptions = null;
          const existing = await prisma.episode.findUnique({
            where: { seasonId_number_audioKind_language: { seasonId: row.id, number, audioKind, language: "" } }
          });
          const keepVideo = existing?.videoUrl?.startsWith("/media/");
          const keepCaptions = existing?.subtitleUrl?.startsWith("/media/");
          await prisma.episode.upsert({
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
              ...(keepVideo ? {} : { videoUrl: null }),
              ...(keepCaptions ? {} : { subtitleUrl: demoCaptions })
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
              subtitleUrl: demoCaptions
            }
          });
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

  const banner = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  if (!banner) {
    await prisma.siteSetting.create({
      data: {
        id: "default",
        announcement: "Summer week: Harbor Lights E4, Night Train, and Quiet Frequency — Sub and Dub.",
        announcementHref: "/latest"
      }
    });
  } else if (!banner.announcement) {
    await prisma.siteSetting.update({
      where: { id: "default" },
      data: {
        announcement: "Summer week: Harbor Lights E4, Night Train, and Quiet Frequency — Sub and Dub.",
        announcementHref: "/latest"
      }
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

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
