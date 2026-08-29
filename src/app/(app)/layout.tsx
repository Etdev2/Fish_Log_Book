import { BackupBadge } from "@/features/shell/components/backup-badge";
import { QuickMarkButton } from "@/features/shell/components/quick-mark-button";
import { ShellNav } from "@/features/shell/components/shell-nav";

/**
 * THE SHELL (ADR 005 §4): nav, backup badge, quick mark. Nothing else.
 *
 * The auth gate is in src/proxy.ts rather than here. A cookie read in this layout would
 * make every product route dynamic, and ADR 005 §5 forbids that — the whole point of the
 * static shell is that a cold load on a boat paints without the network.
 *
 * Chrome is opt-in by route group: (auth) and (internal) inherit none of this.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
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
