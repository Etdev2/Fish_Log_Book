"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getDemoTournaments, hasSupabaseBrowserConfig, type DemoTournament } from "../demo-store";
import { countdown, formatSchedule, tournamentPhase, visibilityLabel } from "../format";
import { useNow } from "../use-now";
import { BIG_ACTION, CARD, FOCUS_RING, PAGE, PRIMARY_BUTTON, TABULAR } from "../ui-classes";
import { DemoNote, EmptyState, ErrorScreen, LoadingScreen, SectionHeading, StatusPill } from "./tournament-chrome";
import { ChevronIcon, ClockIcon, PlusIcon } from "./icons";

/**
 * /tournaments — the way in.
 *
 * The old version was two flat lists titled "My tournaments" and "Public tournaments",
 * sorted by creation date, with a tournament being fished *right now* sitting below one
 * created yesterday that starts in March. The fix is to sort by what a person is about to
 * do rather than by when a row was written: what is happening now, then what is yours,
 * then what you could enter.
 */

type TournamentCard = Pick<
  DemoTournament,
  "id" | "name" | "status" | "visibility" | "starts_at" | "ends_at"
>;

const LIST_COLUMNS = "id,name,status,visibility,starts_at,ends_at,created_at";

type Load =
  | { readonly state: "loading" }
  | { readonly state: "error"; readonly message: string }
  | { readonly state: "ready"; readonly owned: TournamentCard[]; readonly open: TournamentCard[] };

export function TournamentHub() {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [reloadToken, setReloadToken] = useState(0);
  const demoMode = !hasSupabaseBrowserConfig();

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // Yield before the first `setState` so nothing is set synchronously inside the
      // effect body — see `use-tournament.ts` for the full reason.
      await Promise.resolve();
      if (cancelled) return;
      setLoad({ state: "loading" });

      if (!hasSupabaseBrowserConfig()) {
        const demo = getDemoTournaments();
        setLoad({ state: "ready", owned: demo, open: [] });
        return;
      }

      try {
        const supabase = createClient();
        const [ownedResult, publicResult] = await Promise.all([
          supabase
            .from("tournament")
            .select(LIST_COLUMNS)
            .is("deleted_at", null)
            .order("created_at", { ascending: false }),
          supabase
            .from("public_tournament")
            .select(LIST_COLUMNS)
            .eq("visibility", "PUBLIC")
            .order("created_at", { ascending: false })
            .limit(24),
        ]);

        if (cancelled) return;
        const failure = ownedResult.error ?? publicResult.error;
        if (failure) {
          setLoad({ state: "error", message: failure.message });
          return;
        }

        const owned = (ownedResult.data ?? []) as TournamentCard[];
        const open = ((publicResult.data ?? []) as TournamentCard[]).filter(
          (item) => !owned.some((own) => own.id === item.id),
        );
        setLoad({ state: "ready", owned, open });
      } catch (cause) {
        if (cancelled) return;
        setLoad({
          state: "error",
          message: cause instanceof Error ? cause.message : "Tournaments could not be loaded.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  if (load.state === "loading") return <LoadingScreen label="Loading tournaments" />;
  if (load.state === "error") {
    return (
      <ErrorScreen
        title="Tournaments did not load"
        message={`${load.message} Everything else in the app still works — this is the tournament connection only.`}
        onRetry={retry}
      />
    );
  }

  const all = [...load.owned, ...load.open];
  const live = all.filter((item) => tournamentPhase(item.status) === "during");
  const liveIds = new Set(live.map((item) => item.id));
  const yours = sortForReading(load.owned.filter((item) => !liveIds.has(item.id)));
  const toEnter = sortForReading(load.open.filter((item) => !liveIds.has(item.id)));

  return (
    <div className={PAGE}>
      <header className="flex flex-col gap-space-4">
        <div className="flex flex-col gap-space-2">
          <h1 className="text-h1 text-text-primary">Tournaments</h1>
          <p className="text-body text-text-muted">
            A Saturday bet with three friends, or a hundred boats and a payout. Same engine, and you
            only meet the parts you need.
          </p>
        </div>
        <Link href="/tournaments/new" className={BIG_ACTION}>
          <PlusIcon />
          Create a tournament
        </Link>
      </header>

      {live.length > 0 ? (
        <section className="flex flex-col gap-space-3" aria-labelledby="live-heading">
          <SectionHeading aside={live.length > 1 ? `${live.length} running` : undefined}>
            <span id="live-heading">Happening now</span>
          </SectionHeading>
          <ul className="flex flex-col gap-space-3">
            {live.map((item) => (
              <li key={item.id}>
                <TournamentRow tournament={item} emphasis />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-space-3" aria-labelledby="yours-heading">
        <SectionHeading>
          <span id="yours-heading">Your tournaments</span>
        </SectionHeading>
        {yours.length === 0 ? (
          <EmptyState
            title="You have not run one yet"
            body="Name it, pick a day, decide who can see it. That is the whole setup — the rest can wait until you need it."
            action={
              <Link href="/tournaments/new" className={PRIMARY_BUTTON}>
                Create a tournament
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-space-3">
            {yours.map((item) => (
              <li key={item.id}>
                <TournamentRow tournament={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {toEnter.length > 0 ? (
        <section className="flex flex-col gap-space-3" aria-labelledby="open-heading">
          <SectionHeading>
            <span id="open-heading">Open to enter</span>
          </SectionHeading>
          <ul className="flex flex-col gap-space-3">
            {toEnter.map((item) => (
              <li key={item.id}>
                <TournamentRow tournament={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {demoMode ? <DemoNote /> : null}
    </div>
  );
}

/**
 * Sorting a mixed list of dates so it reads the way a person expects: the next thing
 * first, then the rest of the future, then anything undated, then the past most-recent
 * first. Creation order — what the old list used — is the one order nobody is looking for.
 */
function sortForReading(items: readonly TournamentCard[]): TournamentCard[] {
  const now = Date.now();
  const key = (item: TournamentCard) => {
    const start = item.starts_at ? Date.parse(item.starts_at) : Number.NaN;
    if (Number.isNaN(start)) return { bucket: 1, order: 0 };
    if (tournamentPhase(item.status) === "after" || start < now) return { bucket: 2, order: -start };
    return { bucket: 0, order: start };
  };

  return [...items].sort((a, b) => {
    const left = key(a);
    const right = key(b);
    return left.bucket - right.bucket || left.order - right.order;
  });
}

/**
 * One tournament, as a whole-card link.
 *
 * The card is the target, not a word inside it — design 04 allows a card to be tappable as
 * a unit as long as it takes the button's pressed and focus behaviour, which it does here.
 * On a phone that is the difference between a 300px target and a 90px one.
 */
function TournamentRow({ tournament, emphasis = false }: { tournament: TournamentCard; emphasis?: boolean }) {
  const now = useNow();
  const clock =
    now === 0
      ? null
      : countdown(now, {
          status: tournament.status,
          startsAt: tournament.starts_at,
          endsAt: tournament.ends_at,
        });

  return (
    <Link
      href={`/tournaments/${tournament.id}/overview`}
      className={`${CARD} ${FOCUS_RING} flex items-center gap-space-3 p-space-4 transition-colors hover:border-border-interactive active:scale-[0.995] motion-reduce:transition-none ${
        emphasis ? "border-signal-orange/50 bg-linear-to-b from-surface-raised to-surface" : ""
      }`}
    >
      {/*
        Name on its own line, everything else under it. Putting the pill inline with the
        name meant a short name kept it on the same row and a long one pushed it onto the
        next, so a list of three tournaments had three different shapes.
      */}
      <span className="flex min-w-0 flex-1 flex-col gap-space-2">
        <span className="text-body-strong text-text-primary">{tournament.name}</span>
        <span className="flex flex-wrap items-center gap-space-2">
          <StatusPill status={tournament.status} />
        </span>
        <span className="text-caption text-text-muted">
          {formatSchedule(tournament.starts_at, tournament.ends_at)} · {visibilityLabel(tournament.visibility)}
        </span>
        {clock ? (
          <span
            className={`inline-flex items-center gap-space-2 text-caption ${clock.urgent ? "text-signal-orange" : "text-text-muted"}`}
          >
            <ClockIcon size="h-space-4 w-space-4" />
            <span className={TABULAR}>{clock.label}</span>
          </span>
        ) : null}
      </span>
      <ChevronIcon size="h-space-5 w-space-5" className="text-text-muted" />
    </Link>
  );
}
