import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import tokens from "@/core/design/tokens.json";

import "./globals.css";

/*
 * Root layout (ADR 005 §4): <html>, <body>, fonts, globals. Nothing else.
 * Product chrome is opt-in per route group — see src/app/(app)/layout.tsx.
 */

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
