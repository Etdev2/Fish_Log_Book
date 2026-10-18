import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

import tokens from "@/core/design/tokens.json";

import "./globals.css";

/*
 * Root layout (ADR 005 §4): <html>, <body>, fonts, globals. Nothing else.
 * Product chrome is opt-in per route group — see src/app/(app)/layout.tsx.
 */

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Fish Log Book",
  description: "Log every trip — including the ones that caught nothing.",
  // Opened from the iPhone home screen, the app runs full-screen. "black" keeps the page
  // below the status bar, so no screen needs a top safe-area inset.
  appleWebApp: { capable: true, title: "Fish Log", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: tokens.color.background.dark,
  // The app is used one-handed on a moving boat; pinch-zoom stays available.
  width: "device-width",
  initialScale: 1,
  // Draw to the bottom edge of the iPhone; the bottom dock pads itself for the home
  // indicator with env(safe-area-inset-bottom) (shell-nav.tsx).
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
