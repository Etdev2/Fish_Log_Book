import type { Metadata } from "next";

import { HomeScreen } from "@/features/home/components/home-screen";
import { SetupBanner } from "@/features/setup/components/setup-banner";

export const metadata: Metadata = { title: "Home | Fish Log Book" };

/**
 * / — Home. Founder, 2026-10-16: the calendar moves off the front page (it lives at
 * /calendar now) and Home becomes the screen you want to open: what the water is doing
 * right now, your week, the badge you are closest to, and one big button to log a fish.
 * This supersedes D23 ("the calendar is the home surface").
 */
export default function HomePage() {
  return (
    /*
      The setup invitation (gone once setup is finished — see `setup-banner.tsx`) is
      handed to Home so it renders under the Log a catch button, not above the greeting.
    */
    <HomeScreen setup={<SetupBanner />} />
  );
}
