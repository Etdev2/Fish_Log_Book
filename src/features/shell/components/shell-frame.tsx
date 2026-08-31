"use client";

import { usePathname } from "next/navigation";

import { BackupBadge } from "./backup-badge";
import { QuickMarkButton } from "./quick-mark-button";
import { ShellNav } from "./shell-nav";

/**
 * The shell's frame: the top status row, the main slot, and the bottom nav.
 *
 * One route is immersive. The tide screen is a single-screen instrument — the founder's
 * brief for it is explicit that nothing else may consume its vertical room and that the
 * page must not scroll — so on `/tides` the top row (backup badge + quick mark) is not
 * rendered and `main` runs edge to edge at exactly the viewport height. Every other route
 * keeps the shell exactly as ADR 005 §4 describes it.
 *
 * The quick mark is not lost on that route: it is not wired to anything yet (see
 * `quick-mark-button.tsx`), and when logging lands it needs a real home on the tide screen
 * rather than a header bar sitting on top of the chart. That is a design decision for the
 * screen it lands on, and it is called out in the worklog rather than left implicit here.
 *
 * `children` is passed through untouched, so every page below this stays a server
 * component — only this frame is client-side, and only because it reads the pathname.
 */
export function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
      <header className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-3">
        <BackupBadge />
        <QuickMarkButton />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>

      <ShellNav />
    </div>
  );
}
