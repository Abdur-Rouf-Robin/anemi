import type { HomePayload, TitleDetail } from "./types";

const titles: TitleDetail[] = [
  {
    id: "t1",
    slug: "harbor-lights",
    type: "SERIES",
    status: "AIRING",
    name: "Harbor Lights",
    year: 2026,
    hue: 38,
    viewCount: 9200,
    spotlight: true,
    posterUrl: "/posters/harbor-lights.jpg",
    backdropUrl: "/posters/harbor-lights.jpg",
    synopsis: "A night dispatcher in a coastal city starts hearing ships that are not on any chart.",
    genres: [
      { slug: "mystery", name: "Mystery" },
      { slug: "drama", name: "Drama" }
    ],
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "e-hl-1", number: 1, name: "The first horn", durationSec: 1420, introStartSec: 40, introEndSec: 95 },
          { id: "e-hl-2", number: 2, name: "Fog bank", durationSec: 1380 },
          { id: "e-hl-3", number: 3, name: "Unlisted berth", durationSec: 1440 },
          { id: "e-hl-4", number: 4, name: "Low tide", durationSec: 1410 }
        ]
      },
      {
        number: 2,
        episodes: [
          { id: "e-hl-5", number: 1, name: "Second watch", durationSec: 1430 },
          { id: "e-hl-6", number: 2, name: "Chart error", durationSec: 1390 }
        ]
      }
    ]
  },
  {
    id: "t2",
    slug: "paper-kite",
    type: "SERIES",
    status: "COMPLETED",
    name: "Paper Kite",
    year: 2024,
    hue: 200,
    viewCount: 8100,
    synopsis: "Two siblings rebuild a festival kite that remembers every wish tied to its tail.",
    genres: [
      { slug: "adventure", name: "Adventure" },
      { slug: "slice", name: "Slice of life" }
    ],
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "e-pk-1", number: 1, name: "String", durationSec: 1320 },
          { id: "e-pk-2", number: 2, name: "Wind", durationSec: 1290 },
          { id: "e-pk-3", number: 3, name: "Sky", durationSec: 1400 }
        ]
      }
    ]
  },
  {
    id: "t3",
    slug: "glass-garden",
    type: "MOVIE",
    status: "COMPLETED",
    name: "Glass Garden",
    year: 2025,
    hue: 150,
    viewCount: 6400,
    synopsis: "A conservatory that grows memories instead of plants. One visitor comes to forget.",
    genres: [
      { slug: "drama", name: "Drama" },
      { slug: "scifi", name: "Sci-Fi" }
    ],
    seasons: [{ number: 1, episodes: [{ id: "e-gg-1", number: 1, name: "Glass Garden", durationSec: 6120 }] }]
  },
  {
    id: "t4",
    slug: "night-train",
    type: "SERIES",
    status: "AIRING",
    name: "Night Train",
    year: 2026,
    hue: 280,
    viewCount: 7700,
    synopsis: "The last carriage of the midnight express only appears for people who missed a chance.",
    genres: [
      { slug: "mystery", name: "Mystery" },
      { slug: "adventure", name: "Adventure" }
    ],
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "e-nt-1", number: 1, name: "Platform 9", durationSec: 1360 },
          { id: "e-nt-2", number: 2, name: "Ticket without a name", durationSec: 1390 },
          { id: "e-nt-3", number: 3, name: "Next stop", durationSec: 1410 }
        ]
      }
    ]
  },
  {
    id: "t5",
    slug: "second-light",
    type: "MOVIE",
    status: "COMPLETED",
    name: "Second Light",
    year: 2023,
    hue: 12,
    viewCount: 5100,
    synopsis: "After a city-wide blackout, the first lamp that turns back on belongs to no one.",
    genres: [{ slug: "scifi", name: "Sci-Fi" }],
    seasons: [{ number: 1, episodes: [{ id: "e-sl-1", number: 1, name: "Second Light", durationSec: 5880 }] }]
  },
  {
    id: "t6",
    slug: "copper-sky",
    type: "SERIES",
    status: "COMPLETED",
    name: "Copper Sky",
    year: 2022,
    hue: 55,
    viewCount: 4300,
    synopsis: "Crop-dusters in a desert valley start painting weather that has not happened yet.",
    genres: [{ slug: "adventure", name: "Adventure" }],
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "e-cs-1", number: 1, name: "Dust", durationSec: 1280 },
          { id: "e-cs-2", number: 2, name: "Thermals", durationSec: 1310 }
        ]
      }
    ]
  },
  {
    id: "t7",
    slug: "quiet-frequency",
    type: "SERIES",
    status: "AIRING",
    name: "Quiet Frequency",
    year: 2026,
    hue: 230,
    viewCount: 6900,
    synopsis: "A campus radio show receives unsent letters from listeners who have not written yet.",
    genres: [{ slug: "mystery", name: "Mystery" }],
    seasons: [
      {
        number: 1,
        episodes: [
          { id: "e-qf-1", number: 1, name: "Sign on", durationSec: 1340 },
          { id: "e-qf-2", number: 2, name: "Dead air", durationSec: 1370 },
          { id: "e-qf-3", number: 3, name: "Call in", durationSec: 1400 }
        ]
      }
    ]
  },
  {
    id: "t8",
    slug: "last-ember",
    type: "MOVIE",
    status: "COMPLETED",
    name: "Last Ember",
    year: 2021,
    hue: 18,
    viewCount: 3900,
    synopsis: "The last kiln in a mountain town fires one more pot — and it will not cool.",
    genres: [{ slug: "drama", name: "Drama" }],
    seasons: [{ number: 1, episodes: [{ id: "e-le-1", number: 1, name: "Last Ember", durationSec: 5640 }] }]
  },
  {
    id: "t9",
    slug: "salt-overture",
    type: "OVA",
    status: "COMPLETED",
    name: "Salt Overture",
    year: 2025,
    hue: 92,
    viewCount: 2100,
    posterUrl: "/posters/salt-overture.jpg",
    backdropUrl: "/posters/salt-overture.jpg",
    synopsis: "A one-night concert on a salt flat that only the tide can hear.",
    genres: [{ slug: "drama", name: "Drama" }],
    seasons: [{ number: 1, episodes: [{ id: "e-so-1", number: 1, name: "Salt Overture", durationSec: 1680 }] }]
  },
  {
    id: "t10",
    slug: "iron-garden",
    type: "SERIES",
    status: "UPCOMING",
    name: "Iron Garden",
    year: 2026,
    hue: 28,
    viewCount: 1200,
    nextAirDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    posterUrl: "/posters/iron-garden.jpg",
    backdropUrl: "/posters/iron-garden.jpg",
    synopsis: "A botanist inherits a greenhouse that grows tools instead of flowers.",
    genres: [{ slug: "fantasy", name: "Fantasy" }],
    seasons: [{ number: 1, episodes: [{ id: "e-ig-1", number: 1, name: "First rust", durationSec: 1380 }] }]
  },
  {
    id: "t11",
    slug: "tide-clock",
    type: "MOVIE",
    status: "UPCOMING",
    name: "Tide Clock",
    year: 2026,
    hue: 205,
    viewCount: 980,
    nextAirDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    posterUrl: "/posters/tide-clock.jpg",
    backdropUrl: "/posters/tide-clock.jpg",
    synopsis: "A harbor clock that runs on the tide starts counting days that have not arrived.",
    genres: [{ slug: "mystery", name: "Mystery" }],
    seasons: [{ number: 1, episodes: [{ id: "e-tc-1", number: 1, name: "Tide Clock", durationSec: 6120 }] }]
  }
];

export const demoTitles = titles;

export function demoHome(): HomePayload {
  return {
    spotlight: titles[0],
    spotlights: titles.filter((t) => t.spotlight),
    trending: [...titles].sort((a, b) => b.viewCount - a.viewCount),
    movies: titles.filter((t) => t.type === "MOVIE"),
    series: titles.filter((t) => t.type === "SERIES"),
    animation: titles.filter((t) => t.type === "OVA" || t.type === "ONA" || t.type === "SPECIAL"),
    airing: titles.filter((t) => t.status === "AIRING"),
    upcoming: titles.filter((t) => t.status === "UPCOMING"),
    completed: titles.filter((t) => t.status === "COMPLETED"),
    added: titles,
    latest: titles,
    charts: {
      day: titles.slice(0, 5),
      week: titles.slice(0, 7),
      month: titles
    }
  };
}

export function filterTitles(params: {
  q?: string;
  type?: string;
  status?: string;
  genre?: string;
  sort?: string;
}) {
  let items = [...titles];
  if (params.q) {
    const q = params.q.toLowerCase();
    items = items.filter(
      (t) => t.name.toLowerCase().includes(q) || t.synopsis.toLowerCase().includes(q)
    );
  }
  if (params.type === "ANIMATION") {
    items = items.filter((t) => t.type === "OVA" || t.type === "ONA" || t.type === "SPECIAL");
  } else if (params.type) {
    items = items.filter((t) => t.type === params.type);
  }
  if (params.status) items = items.filter((t) => t.status === params.status);
  if (params.genre) items = items.filter((t) => t.genres.some((g) => g.slug === params.genre));
  if (params.sort === "az") items.sort((a, b) => a.name.localeCompare(b.name));
  else if (params.sort === "newest") items.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  else items.sort((a, b) => b.viewCount - a.viewCount);
  return items;
}

export function titleBySlug(slug: string) {
  return titles.find((t) => t.slug === slug) ?? null;
}

export function episodeById(id: string) {
  for (const title of titles) {
    for (const season of title.seasons) {
      const episode = season.episodes.find((e) => e.id === id);
      if (episode) return { title, season, episode };
    }
  }
  return null;
}
