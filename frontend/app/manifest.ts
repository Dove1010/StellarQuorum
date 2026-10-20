import type { MetadataRoute } from "next";
import { t } from "@/lib/i18n";

// Issue #144: the web manifest. It is what an install prompt, a home screen or
// a launcher reads for the app's name and colour before a single pixel of the
// app is drawn.
//
// The icons are the two rasters in public/, referenced by stable URL: the files
// Next.js generates for app/icon.* get content-hashed paths, which a manifest
// cannot name. app/icon.svg and app/favicon.ico cover the head links.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: t("metadata.title"),
    short_name: "Quorum",
    description: t("metadata.description"),
    // Fixed, because the manifest is served from a fixed URL: a start_url with
    // a query string makes the browser treat every campaign link as its own app.
    id: "/",
    start_url: "/",
    // Standalone mode makes the app installable as a PWA with its own window.
    display: "standalone",
    // The app's own dark surface, so a launched window is not a white flash
    // before the first paint. Matches the body background in globals.css.
    background_color: "#080c10",
    theme_color: "#080c10",
    icons: [
      // "any" only. The mark fills its tile by design, so a maskable icon
      // would be clipped by a circular crop — declaring one would be a lie.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
