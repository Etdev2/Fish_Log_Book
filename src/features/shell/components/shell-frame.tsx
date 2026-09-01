"use client";

import { usePathname } from "next/navigation";

import { useQuickMarkEnabled } from "@/features/settings/shortcuts";
import { BackupBadge } from "./backup-badge";
import { QuickMarkAction } from "./quick-mark-action";
import { ShellNav } from "./shell-nav";

/**
 * The shell's frame: a slim status line, the main slot, and the bottom nav.
 *
 * **The quick mark is no longer here.** It used to be the largest control in the app,
 * pinned to the top of every screen, for a feature most anglers will never switch on. It
 * is an accelerator, not a destination, so it now lives behind Settings → Fishing
 * shortcuts (default off) and, when on, renders bottom-right above the nav where the
 * thumb already is. See `quick-mark-action.tsx` for why there rather than anywhere else.
 *
 * With it gone the header carries only the backup badge, so it collapses to a single
 * quiet status line rather than leaving a hole where the button was.
 *
 * **One route is immersive.** The tide screen is a single-screen instrument — the brief
 * for it is explicit that nothing else may consume its vertical room and that the page
 * must not scroll — so `/tides` gets no status line and `main` runs edge to edge at
 * exactly the viewport height.
 *
 * The quick mark is deliberately not rendered there either, even when enabled. Every
 * placement that fits costs something the tide screen is not allowed to spend: floating
 * it bottom-right puts it on top of the timeline the angler scrubs horizontally, and
 * folding it into the date bar breaks that row's centred three-column symmetry. Giving
 * it a home on that screen is a design decision for the tide screen itself, and this
 * revision was explicitly told not to redesign Tide. Stated in the worklog rather than
 * left for somebody to discover.
 *
 * `children` is passed through untouched, so every page below this stays a server
 * component — only this frame is client-side, and only because it reads the pathname
 * and one local preference.
 */
export function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [quickMarkEnabled] = useQuickMarkEnabled();
  const immersive = pathname === "/tides" || pathname.startsWith("/tides/");

  if (immersive) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden">
        <main className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col">{children}</main>
        <ShellNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center border-b border-hairline px-4 py-3">
        <BackupBadge />
      </header>

      {/*
        `pb-24` reserves room so the last card in a list can be scrolled clear of the
        floating action. It is only paid when the control is actually there — switching
        it off leaves no gap behind.
      */}
      <main className={`mx-auto w-full max-w-3xl flex-1 px-4 py-6 ${quickMarkEnabled ? "pb-24" : ""}`}>
        {children}
      </main>

      {/*
        The bottom dock. The quick mark is absolutely positioned at `bottom-full` — the
        dock's own top edge, which is exactly the nav's top edge — so it can never sit on
        top of the navigation however tall either one becomes. That is why this is a
        wrapper rather than a `bottom-0` float with a hardcoded nav height in it: the
        first version of this did overlap the Settings tab, and a magic number would only
        have hidden the bug until the nav changed.

        `pointer-events-none` on the layer; the control re-enables it on its own
        elements, so the empty space beside the button never swallows a tap meant for the
        list underneath it.
      */}
      <div className="sticky bottom-0 z-10">
        {quickMarkEnabled ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-full mx-auto flex w-full max-w-3xl justify-end px-4 pb-3">
            <QuickMarkAction />
          </div>
        ) : null}
        <ShellNav />
      </div>
    </div>
  );
}
