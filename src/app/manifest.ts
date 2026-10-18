import type { MetadataRoute } from "next";

import tokens from "@/core/design/tokens.json";

/**
 * Web app manifest: what "Add to Home Screen" installs.
 *
 * `standalone` opens the app full-screen without Safari's bars, so on an iPhone it looks
 * and scrolls like an app rather than a web page. This is the web client's half of
 * "it has to work native"; the Swift client (ADR 003) is the other half and is not this.
 * Colours come from `tokens.json` so the splash and status bar match the app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fish Log Book",
    short_name: "Fish Log",
    description: "Log every trip — including the ones that caught nothing.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: tokens.color.background.dark,
    theme_color: tokens.color.background.dark,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
