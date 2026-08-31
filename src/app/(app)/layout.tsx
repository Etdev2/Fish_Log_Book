import { ShellFrame } from "@/features/shell/components/shell-frame";

/**
 * THE SHELL (ADR 005 §4): nav, backup badge, quick mark. Nothing else.
 *
 * The auth gate is in src/proxy.ts rather than here. A cookie read in this layout would
 * make every product route dynamic, and ADR 005 §5 forbids that — the whole point of the
 * static shell is that a cold load on a boat paints without the network.
 *
 * Chrome is opt-in by route group: (auth) and (internal) inherit none of this. Which
 * chrome a route inside this group gets is `shell-frame.tsx`'s call — the tide screen is
 * immersive, everything else is the standard frame — and that lives in a client component
 * because it is the one thing here that needs the pathname. `children` still arrives as a
 * server-rendered tree either way.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ShellFrame>{children}</ShellFrame>;
}
