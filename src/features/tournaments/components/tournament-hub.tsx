"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getDemoTournaments, hasSupabaseBrowserConfig, type DemoTournament } from "../demo-store";
import { countdown, formatSchedule, tournamentPhase, visibilityLabel } from "../format";
import { useNow } from "../use-now";
import {
  BIG_ACTION,
  CARD,
  CARD_PADDED,
  FOCUS_RING,
  PAGE,
  PRIMARY_BUTTON,
  TABULAR,
} from "../ui-classes";
import { DemoNote, EmptyState, ErrorScreen, LoadingScreen, SectionHeading, StatusPill } from "./tournament-chrome";
import { ChevronIcon, ClockIcon, PlusIcon } from "./icons";

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
          <span className="text-label text-signal-orange">Tournament center</span>
          <h1 className="text-h1 text-text-primary">Know what is happening. Know what to do next.</h1>
          <p className="text-body text-text-muted">
            Enter events, compete, follow results, or run your own tournament from one place.
          </p>
        </div>
        <Link href="/tournaments/new" className={BIG_ACTION}>
          <PlusIcon />
          Host a tournament
        </Link>
      </header>

      <TournamentFlowIntro />

      {live.length > 0 ? (
        <section className="flex flex-col gap-space-3" aria-labelledby="live-heading">
          <SectionHeading aside={live.length > 1 ? `${live.length} live events` : "Live now"}>
            <span id="live-heading">Compete now</span>
          </SectionHeading>
          <p className="text-body text-text-muted">These events are on the water right now.</p>
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
          <span id="yours-heading">Your events</span>
        </SectionHeading>
        <p className="text-body text-text-muted">Tournaments you created or are already responsible for.</p>
        {yours.length === 0 ? (
          <EmptyState
            title="You have not hosted a tournament yet"
            body="Start with the event basics. Rules, scoring, verification, registration, and payouts can be configured as the tournament takes shape."
            action={
              <Link href="/tournaments/new" className={PRIMARY_BUTTON}>
                Host a tournament
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
          <SectionHeading aside={`${toEnter.length} available`}>
            <span id="open-heading">Find a tournament</span>
          </SectionHeading>
          <p className="text-body text-text-muted">Open events you can review and enter.</p>
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

function TournamentFlowIntro() {
  const steps = [
    ["1", "Choose", "Find an event or create one."],
    ["2", "Enter", "Registration, eligibility, waivers, and payment live here."],
    ["3", "Compete", "Check in, submit catches, and follow event status."],
    ["4", "Results", "See standings, judging outcomes, and final winners."],
  ] as const;

  return (
    <section className={`${CARD_PADDED} flex flex-col gap-space-4`} aria-labelledby="flow-heading">
      <div className="flex flex-col gap-space-1">
        <SectionHeading>
          <span id="flow-heading">The tournament flow</span>
        </SectionHeading>
        <p className="text-body text-text-muted">Every tournament follows the same simple path, even when the rules are different.</p>
      </div>
      <ol className="grid gap-space-3 sm:grid-cols-2">
        {steps.map(([number, title, detail]) => (
          <li key={number} className="flex items-start gap-space-3">
            <span className="flex h-space-8 w-space-8 shrink-0 items-center justify-center rounded-full border border-border-interactive text-label text-signal-orange">
              {number}
            </span>
            <span className="flex flex-col gap-space-1">
              <span className="text-body-strong text-text-primary">{title}</span>
              <span className="text-caption text-text-muted">{detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

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
      <span className="flex min-w-0 flex-1 flex-col gap-space-2">
        <span className="text-body-strong text-text-primary">{tournament.name}</span>
        <span className="flex flex-wrap items-center gap-space-2">
          <StatusPill status={tournament.status} />
          <span className="text-caption text-text-muted">{visibilityLabel(tournament.visibility)}</span>
        </span>
        <span className="text-caption text-text-muted">
          {formatSchedule(tournament.starts_at, tournament.ends_at)}
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
      <span className="flex shrink-0 items-center gap-space-1 text-label text-text-link">
        Open
        <ChevronIcon size="h-space-5 w-space-5" />
      </span>
    </Link>
  );
}
