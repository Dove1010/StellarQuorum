import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WalletProvider from "@/components/WalletProvider";
import { RpcHealthProvider } from "@/lib/rpc-health";
import { getLocale, t } from "@/lib/i18n";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

/*
 * Issue #145: both faces come from next/font, which downloads them at build
 * time and serves them from this origin — no request to a font CDN at runtime,
 * and nothing for the content security policy to have to allow.
 *
 * `variable` hands the generated family to the element as a custom property
 * instead of a class, which is what lets globals.css point Tailwind's theme at
 * it (`@theme inline`). `display: "swap"` shows text in the fallback rather
 * than invisible while the font loads, and next/font's size-adjusted fallback
 * metrics keep that swap from moving anything on screen.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: t("metadata.title"),
  description: t("metadata.description"),
  // The icons, favicon and manifest are picked up from app/icon.svg,
  // app/favicon.ico, app/apple-icon.png and app/manifest.ts — see
  // scripts/generate-icons.mjs for the artwork.
  applicationName: "Quorum",
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "Quorum Governance Proposals" }],
    },
  },
};

// Issue #144: the app is dark on every surface, so the browser chrome has to be
// told. This is the colour a mobile launcher paints behind the icon and around
// a standalone window; without it an installed copy opens as a white flash.
export const viewport: Viewport = {
  themeColor: "#080c10",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={getLocale()}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080c10] text-slate-100">
        <WalletProvider>
          <RpcHealthProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </RpcHealthProvider>
        </WalletProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
