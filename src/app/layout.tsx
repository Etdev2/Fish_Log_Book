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
};

export const viewport: Viewport = {
  themeColor: tokens.color.background.dark,
  // The app is used one-handed on a moving boat; pinch-zoom stays available.
  width: "device-width",
  initialScale: 1,
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
