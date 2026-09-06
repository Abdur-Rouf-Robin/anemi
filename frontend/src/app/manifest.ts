import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Anemi",
    short_name: "Anemi",
    description: "Search, tap, watch. A catalog for video you own or license.",
    start_url: "/",
    display: "standalone",
    background_color: "#12101c",
    theme_color: "#12101c",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
