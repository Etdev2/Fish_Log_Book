/** Small formatters the game screens share. Pure, so they are trivially testable. */

import { MODES } from "@/core/rules/games/modes";
import type { GameMode } from "@/core/rules/games/types";

export function modeName(mode: GameMode): string {
  return MODES.find((m) => m.mode === mode)?.name ?? "Game";
}

/** "1:24:03" while a game runs. Hours only appear once there are some. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** "2 hours left", "8 minutes left", "Time's up". Words, not a bare countdown. */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "Time's up";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min left`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} hr left`;
  return `${hours} hr ${rest} min left`;
}

/** "Today", "Yesterday", or a plain date. Never a raw ISO string in front of an angler. */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const days = Math.floor((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Kelp bass · 4 lb 2 oz" style summary line for a scoring catch. */
export function pointsLabel(points: number): string {
  return `${points > 0 ? "+" : ""}${points} ${Math.abs(points) === 1 ? "pt" : "pts"}`;
}
