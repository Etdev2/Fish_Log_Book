"use client";

import Link from "next/link";
import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import styles from "./learning-dashboard.module.css";

type BuildStatus =
  | "Working now"
  | "Prototype"
  | "Planned"
  | "Needs a decision";

type ItemId = "entry" | "catch" | "conditions" | "history" | "protection";

type BuilderItem = {
  id: ItemId;
  sequence: string;
  journeyLabel: string;
  title: string;
  status: BuildStatus;
  reason: string;
  userView: string;
  reality: string;
  dataFlow: [string, string, string, string];
  actionLabel: string;
};

type FeedbackStatus = "Approved" | "Needs changes" | "Idea";

type SavedFeedback = {
  reviewer: string;
  status: FeedbackStatus;
  comment: string;
  recordedAt: string;
};

type FeedbackStore = Partial<Record<ItemId, SavedFeedback>>;

type GuideStep = {
  itemId: Exclude<ItemId, "protection">;
  eyebrow: string;
  title: string;
  copy: string;
  note: string;
};

const STORAGE_KEY = "fish-log-book.learning-dashboard.feedback.v1";

const BUILDER_ITEMS: BuilderItem[] = [
  {
    id: "entry",
    sequence: "01",
    journeyLabel: "Open the app",
    title: "App entry and Supabase status",
    status: "Working now",
    reason: "The / route exists and reports the current connection state.",
    userView:
      "A clear Fish Log Book entry screen and the current Supabase connection status. It gives the team one honest, working starting point.",
    reality:
      "Real route and real status check. The dashboard does not claim that catch logging exists there yet.",
    dataFlow: [
      "Open /",
      "Next.js server route",
      "Supabase status check",
      "Connection state shown",
    ],
    actionLabel: "Open real app route",
  },
  {
    id: "catch",
    sequence: "02",
    journeyLabel: "Log a catch",
    title: "Quick mark / log a catch",
    status: "Prototype",
    reason: "The approved one-tap direction is mocked; no catch UI exists yet.",
    userView:
      "One large LOG A CATCH target while fishing, with the slower trip details kept out of the fast path.",
    reality:
      "Fictional interactive mock only. Pressing it here never creates a catch, trip, location, or database record.",
    dataFlow: [
      "Tap mock button",
      "Prototype state only",
      "No shared write",
      "Fictional confirmation shown",
    ],
    actionLabel: "Open catch prototype",
  },
  {
    id: "conditions",
    sequence: "03",
    journeyLabel: "Review conditions",
    title: "Tide and moon conditions",
    status: "Planned",
    reason: "Tide and moon are approved, but no user-facing conditions route exists.",
    userView:
      "Readable tide movement and moon context next to a trip so a person can compare conditions over time.",
    reality:
      "Approved direction, not working software. This preview uses fictional values and excludes weather and pressure.",
    dataFlow: [
      "Open conditions",
      "Planned app state",
      "Future tide + moon enrichment",
      "Context beside the log",
    ],
    actionLabel: "View planned direction",
  },
  {
    id: "history",
    sequence: "04",
    journeyLabel: "See history and insights",
    title: "Calendar history and insights",
    status: "Prototype",
    reason: "The approved calendar/notebook direction is mocked; no history route exists.",
    userView:
      "A calm calendar where any honestly completed day counts equally, plus notebook context for later reference.",
    reality:
      "Fictional visual mock only. It shows no bite score, streak, leaderboard, or production history.",
    dataFlow: [
      "Choose a sample day",
      "Prototype selection",
      "Fictional trip + note",
      "Day story shown",
    ],
    actionLabel: "Open history prototype",
  },
  {
    id: "protection",
    sequence: "—",
    journeyLabel: "Release boundary",
    title: "Future Builder View protection",
    status: "Needs a decision",
    reason: "Access control is deferred; its method and timing are not selected.",
    userView:
      "Today, this public-safe prototype is reachable from navigation. A future team surface must be separated before sensitive material appears.",
    reality:
      "There is no passcode or access control. This dashboard therefore contains no secrets, private customer data, coordinates, or operational controls.",
    dataFlow: [
      "Open Builder View",
      "Public-safe prototype",
      "No sensitive data",
      "Decision still required",
    ],
    actionLabel: "View decision boundary",
  },
];

const GUIDE_STEPS: GuideStep[] = [
  {
    itemId: "entry",
    eyebrow: "Tour representation · real route available at /",
    title: "Open the app",
    copy: "Fish Log Book is meant to make fishing memory useful: record activity quickly, then connect honest trip history with conditions over time.",
    note: "This is a simplified representation, not a live status result. Open the real / route to see its current connection check. Catch, conditions, and history screens are not built yet.",
  },
  {
    itemId: "catch",
    eyebrow: "Prototype · no data is saved",
    title: "Log a catch",
    copy: "The approved fast path centers one large target. A catch mark should be immediate; details can wait until your hands are free.",
    note: "This is a fictional sample screen. The prototype button does not write a catch, trip, or location.",
  },
  {
    itemId: "conditions",
    eyebrow: "Planned · fictional sample values",
    title: "Review conditions",
    copy: "Tide movement and moon context can sit beside the log, making it easier to compare what happened across trips.",
    note: "Tide and moon are approved direction, not implemented behavior. Weather and pressure are intentionally not shown.",
  },
  {
    itemId: "history",
    eyebrow: "Prototype · no production history",
    title: "See history and insights",
    copy: "A calendar and notebook make completed trips easy to revisit. Useful patterns improve as catches and blank trips are recorded honestly.",
    note: "This fictional preview treats caught and confirmed-blank days equally. It does not render a bite score.",
  },
];

const STATUS_CLASS: Record<BuildStatus, string> = {
  "Working now": styles.statusWorking,
  Prototype: styles.statusPrototype,
  Planned: styles.statusPlanned,
  "Needs a decision": styles.statusDecision,
};

const FEEDBACK_OPTIONS: FeedbackStatus[] = [
  "Approved",
  "Needs changes",
  "Idea",
];

const ITEM_IDS: ItemId[] = ["entry", "catch", "conditions", "history", "protection"];

function StatusBadge({ status }: { status: BuildStatus }) {
  return <span className={`${styles.status} ${STATUS_CLASS[status]}`}>{status}</span>;
}

function AccessibleDialog({
  children,
  titleId,
  descriptionId,
  onClose,
  wide = false,
}: {
  children: ReactNode;
  titleId: string;
  descriptionId?: string;
  onClose: () => void;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;

    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      const firstTarget = dialog?.querySelector<HTMLElement>("[data-autofocus]");
      (firstTarget ?? dialog)?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => !element.hasAttribute("hidden"));

    if (focusable.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${wide ? styles.dialogWide : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  );
}

function TideCurve() {
  return (
    <svg
      className={styles.tideCurve}
      viewBox="0 0 320 72"
      role="img"
      aria-label="Fictional tide curve rising toward a high tide"
    >
      <path
        className={styles.tideFill}
        d="M0 58 C50 68 72 64 104 35 C128 12 154 11 181 34 C211 61 235 65 265 36 C285 17 301 13 320 11 L320 72 L0 72 Z"
      />
      <path
        className={styles.tideLine}
        d="M0 58 C50 68 72 64 104 35 C128 12 154 11 181 34 C211 61 235 65 265 36 C285 17 301 13 320 11"
      />
      <circle className={styles.tidePoint} cx="86" cy="50" r="5" />
    </svg>
  );
}

function AppEntryVisual({ highlight = false }: { highlight?: boolean }) {
  return (
    <div className={styles.phoneSurface}>
      <div className={styles.surfaceTopline}>
        <StatusBadge status="Working now" />
        <span>{highlight ? "Tour representation of /" : "Real route: /"}</span>
      </div>
      <div className={styles.entryHero}>
        <p>FISH LOG BOOK</p>
        <h3>Keep the whole trip.</h3>
        <span>Start with what is real today, then build an honest record over time.</span>
      </div>
      <div className={`${styles.connectionCard} ${highlight ? styles.guideTarget : ""}`}>
        <span className={styles.connectionDot} aria-hidden="true" />
        <div>
          <strong>Connection status appears on the real route</strong>
          <span>Open / to see its current result</span>
        </div>
      </div>
    </div>
  );
}

function CatchVisual({ highlight = false }: { highlight?: boolean }) {
  return (
    <div className={styles.phoneSurface}>
      <div className={styles.surfaceTopline}>
        <StatusBadge status="Prototype" />
        <span>Fictional sample · no coordinates</span>
      </div>
      <div className={styles.tripHeader}>
        <div>
          <span>Sample Coast Spot</span>
          <strong>Active trip</strong>
        </div>
        <strong>01:42</strong>
      </div>
      <div className={styles.mapMock} aria-label="Decorative fictional fishing area mock">
        <span className={styles.mapLine} />
        <span className={styles.mapMarkOne} />
        <span className={styles.mapMarkTwo} />
        <small>2 sample marks</small>
      </div>
      <button
        className={`${styles.catchButton} ${highlight ? styles.guideTarget : ""}`}
        type="button"
        onClick={() => undefined}
      >
        LOG A CATCH
        <span>Prototype — nothing saved</span>
      </button>
    </div>
  );
}

function ConditionsVisual({ highlight = false }: { highlight?: boolean }) {
  return (
    <div className={styles.phoneSurface}>
      <div className={styles.surfaceTopline}>
        <StatusBadge status="Planned" />
        <span>Fictional sample values</span>
      </div>
      <div className={`${styles.conditionsCard} ${highlight ? styles.guideTarget : ""}`}>
        <span className={styles.monoLabel}>TIDE · SAMPLE COAST SPOT</span>
        <strong className={styles.tideReading}>Rising · 34%</strong>
        <TideCurve />
        <span className={styles.monoLabel}>Example next high · 2:14 PM</span>
      </div>
      <div className={styles.moonRow}>
        <span className={styles.moon} aria-hidden="true" />
        <div>
          <span className={styles.monoLabel}>MOON</span>
          <strong>Waning gibbous · example</strong>
        </div>
      </div>
      <p className={styles.exclusionNote}>Weather and pressure are not part of this web prototype.</p>
    </div>
  );
}

function HistoryVisual({ highlight = false }: { highlight?: boolean }) {
  const days = [
    { number: "11", state: "" },
    { number: "12", state: "record" },
    { number: "13", state: "" },
    { number: "14", state: "record" },
    { number: "15", state: "flag" },
    { number: "16", state: "" },
    { number: "17", state: "record" },
  ];

  return (
    <div className={styles.phoneSurface}>
      <div className={styles.surfaceTopline}>
        <StatusBadge status="Prototype" />
        <span>Fictional sample history</span>
      </div>
      <div className={`${styles.calendarMock} ${highlight ? styles.guideTarget : ""}`}>
        <div className={styles.calendarHeader}>
          <span>‹ July</span>
          <strong>August 2026</strong>
          <span>Sept ›</span>
        </div>
        <div className={styles.calendarDays}>
          {days.map((day) => (
            <div key={day.number}>
              <span>{day.number}</span>
              {day.state === "record" ? <i aria-label="has a record" /> : null}
              {day.state === "flag" ? <b aria-label="needs a look">⚑</b> : null}
            </div>
          ))}
        </div>
        <div className={styles.calendarLegend}>
          <span>● has a record</span>
          <span>⚑ needs a look</span>
        </div>
      </div>
      <div className={styles.notebookMock}>
        <span className={styles.monoLabel}>SAMPLE NOTEBOOK</span>
        <p>“Slow morning. The blank trip belongs in the story too.”</p>
      </div>
    </div>
  );
}

function ProtectionVisual() {
  return (
    <div className={styles.phoneSurface}>
      <div className={styles.surfaceTopline}>
        <StatusBadge status="Needs a decision" />
        <span>Public-safe prototype</span>
      </div>
      <div className={styles.decisionVisual}>
        <span className={styles.lockOutline} aria-hidden="true">?</span>
        <h3>Protection is deferred</h3>
        <p>
          No passcode or access control exists. Choose the method and timing before this
          view contains customer or sensitive team material.
        </p>
      </div>
      <ul className={styles.safeList}>
        <li>No secrets</li>
        <li>No precise coordinates</li>
        <li>No operational controls</li>
      </ul>
    </div>
  );
}

function ItemVisual({ itemId, highlight = false }: { itemId: ItemId; highlight?: boolean }) {
  switch (itemId) {
    case "entry":
      return <AppEntryVisual highlight={highlight} />;
    case "catch":
      return <CatchVisual highlight={highlight} />;
    case "conditions":
      return <ConditionsVisual highlight={highlight} />;
    case "history":
      return <HistoryVisual highlight={highlight} />;
    case "protection":
      return <ProtectionVisual />;
  }
}

function ModeChooser({
  onStartGuide,
  onOpenBuilder,
  announcement,
  guideButtonRef,
}: {
  onStartGuide: () => void;
  onOpenBuilder: () => void;
  announcement: string;
  guideButtonRef: Ref<HTMLButtonElement>;
}) {
  return (
    <>
      <section className={styles.hero} aria-labelledby="learn-title">
        <div>
          <p className={styles.kicker}>PRODUCT FIELD GUIDE · PROTOTYPE</p>
          <h1 id="learn-title">Learn the journey. Inspect the build.</h1>
          <p>
            Walk through the customer experience, or inspect what is working, mocked,
            planned, and still awaiting a decision.
          </p>
        </div>
        <div className={styles.prototypeNotice}>
          <strong>Prototype boundary</strong>
          <span>
            This dashboard uses fictional samples and never writes catches, trips,
            locations, conditions, or feedback to production data.
          </span>
        </div>
      </section>

      <p className={styles.srOnly} aria-live="polite">
        {announcement}
      </p>

      <section className={styles.modeGrid} aria-label="Choose a learning mode">
        <article className={styles.modeCard}>
          <span className={styles.modeNumber}>01</span>
          <div>
            <p className={styles.cardEyebrow}>CUSTOMER JOURNEY</p>
            <h2>User Guide</h2>
            <p>
              A focused four-step tour of the value, catch flow, conditions context,
              and honest history.
            </p>
          </div>
          <ul>
            <li>4 short steps</li>
            <li>Working and mock states labeled</li>
            <li>Safe to replay or skip</li>
          </ul>
          <button
            ref={guideButtonRef}
            className={styles.primaryButton}
            type="button"
            onClick={onStartGuide}
          >
            Start or replay guide
            <span aria-hidden="true">→</span>
          </button>
        </article>

        <article className={styles.modeCard}>
          <span className={styles.modeNumber}>02</span>
          <div>
            <p className={styles.cardEyebrow}>TEAM PROTOTYPE</p>
            <h2>Builder View</h2>
            <p>
              Follow the same journey as a status map, inspect each data flow, and leave
              feedback on this device.
            </p>
          </div>
          <ul>
            <li>All 4 truth statuses</li>
            <li>Clickable details and previews</li>
            <li>Device-only review notes</li>
          </ul>
          <button className={styles.secondaryButton} type="button" onClick={onOpenBuilder}>
            Open Builder View
            <span aria-hidden="true">→</span>
          </button>
        </article>
      </section>

      <section className={styles.truthStrip} aria-label="Prototype truths">
        <div>
          <span>REAL TODAY</span>
          <strong>App entry + connection status</strong>
        </div>
        <div>
          <span>SAFE SAMPLES</span>
          <strong>No coordinates or customer data</strong>
        </div>
        <div>
          <span>LOCAL REVIEW</span>
          <strong>Feedback stays in this browser</strong>
        </div>
      </section>
    </>
  );
}

function GuideDialog({
  stepIndex,
  onStepChange,
  onClose,
  onSkip,
  onComplete,
}: {
  stepIndex: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
  onSkip: () => void;
  onComplete: () => void;
}) {
  const step = GUIDE_STEPS[stepIndex];
  const isLast = stepIndex === GUIDE_STEPS.length - 1;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => headingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [stepIndex]);

  return (
    <AccessibleDialog
      titleId="guide-dialog-title"
      descriptionId="guide-dialog-copy"
      onClose={onClose}
      wide
    >
      <div className={styles.guideTopbar}>
        <div>
          <span className={styles.progressLabel}>
            Step {stepIndex + 1} of {GUIDE_STEPS.length}
          </span>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={GUIDE_STEPS.length}
            aria-valuenow={stepIndex + 1}
            aria-label={`Guide progress: step ${stepIndex + 1} of ${GUIDE_STEPS.length}`}
          >
            <span style={{ width: `${((stepIndex + 1) / GUIDE_STEPS.length) * 100}%` }} />
          </div>
        </div>
        <button className={styles.textButton} type="button" onClick={onClose} data-autofocus>
          Exit guide
        </button>
      </div>

      <div className={styles.guideBody}>
        <div className={styles.guideVisual}>
          <span className={styles.targetHint}>Highlighted target</span>
          <ItemVisual itemId={step.itemId} highlight />
        </div>
        <div className={styles.guideCopy}>
          <p className={styles.cardEyebrow}>{step.eyebrow}</p>
          <h2 ref={headingRef} id="guide-dialog-title" tabIndex={-1}>{step.title}</h2>
          <p id="guide-dialog-copy" className={styles.guideLead}>{step.copy}</p>
          <div className={styles.truthNote}>
            <strong>What is true here</strong>
            <span>{step.note}</span>
          </div>
          {stepIndex === 0 ? (
            <Link className={styles.guideRouteLink} href="/">
              Open the real app route <span aria-hidden="true">↗</span>
            </Link>
          ) : null}
        </div>
      </div>

      <div className={styles.guideActions}>
        <button className={styles.textButton} type="button" onClick={onSkip}>
          Skip guide
        </button>
        <div>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={stepIndex === 0}
            onClick={() => onStepChange(stepIndex - 1)}
          >
            Back
          </button>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => (isLast ? onComplete() : onStepChange(stepIndex + 1))}
          >
            {isLast ? "Finish" : "Next"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </AccessibleDialog>
  );
}

function DataFlow({ steps }: { steps: BuilderItem["dataFlow"] }) {
  return (
    <ol className={styles.dataFlow} aria-label="Data flow">
      {steps.map((step, index) => (
        <li key={step}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{step}</strong>
        </li>
      ))}
    </ol>
  );
}

function FeedbackForm({
  item,
  saved,
  onSave,
  onReset,
}: {
  item: BuilderItem;
  saved?: SavedFeedback;
  onSave: (feedback: SavedFeedback) => void;
  onReset: () => void;
}) {
  const [reviewer, setReviewer] = useState(saved?.reviewer ?? "");
  const [status, setStatus] = useState<FeedbackStatus | "">(saved?.status ?? "");
  const [comment, setComment] = useState(saved?.comment ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!status || !reviewer.trim()) return;
    onSave({
      reviewer: reviewer.trim(),
      status,
      comment: comment.trim(),
      recordedAt: new Date().toISOString(),
    });
  }

  return (
    <form className={styles.feedbackForm} onSubmit={handleSubmit}>
      <div className={styles.feedbackHeading}>
        <div>
          <p className={styles.cardEyebrow}>REVIEW THIS ITEM</p>
          <h3>Device-local feedback</h3>
        </div>
        <span className={styles.deviceBadge}>Saved on this device only</span>
      </div>

      <fieldset>
        <legend>Review status</legend>
        <div className={styles.feedbackOptions}>
          {FEEDBACK_OPTIONS.map((option) => (
            <label key={option}>
              <input
                type="radio"
                name={`feedback-status-${item.id}`}
                value={option}
                checked={status === option}
                onChange={() => setStatus(option)}
                required
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className={styles.field}>
        <span>Reviewer name</span>
        <input
          type="text"
          autoComplete="name"
          value={reviewer}
          onChange={(event) => setReviewer(event.target.value)}
          required
          maxLength={80}
          placeholder="Your name"
        />
      </label>

      <label className={styles.field}>
        <span>Comment <small>Optional</small></span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="What should stay, change, or be explored?"
        />
      </label>

      {saved ? (
        <p className={styles.savedReceipt} role="status">
          <strong>{saved.status}</strong> by {saved.reviewer} · {formatRecordedAt(saved.recordedAt)}
        </p>
      ) : (
        <p className={styles.localExplainer}>
          Nothing is sent to Supabase or shared with another browser.
        </p>
      )}

      <div className={styles.feedbackActions}>
        <button className={styles.primaryButton} type="submit">Save feedback</button>
        <button className={styles.textButton} type="button" onClick={onReset} disabled={!saved}>
          Reset this item
        </button>
      </div>
    </form>
  );
}

function BuilderView({
  onBack,
  feedback,
  onSaveFeedback,
  onResetFeedback,
  onResetAll,
  onOpenPreview,
  storageError,
}: {
  onBack: () => void;
  feedback: FeedbackStore;
  onSaveFeedback: (itemId: ItemId, value: SavedFeedback) => void;
  onResetFeedback: (itemId: ItemId) => void;
  onResetAll: () => void;
  onOpenPreview: (item: BuilderItem) => void;
  storageError: string;
}) {
  const [selectedId, setSelectedId] = useState<ItemId>("entry");
  const detailRef = useRef<HTMLElement>(null);
  const selected = BUILDER_ITEMS.find((item) => item.id === selectedId) ?? BUILDER_ITEMS[0];

  function selectItem(itemId: ItemId) {
    setSelectedId(itemId);
    window.requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 899px)").matches) {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        detailRef.current?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      }
      detailRef.current?.focus({ preventScroll: true });
    });
  }

  return (
    <section className={styles.builder} aria-labelledby="builder-title">
      <div className={styles.builderHeader}>
        <div>
          <button className={styles.backLink} type="button" onClick={onBack}>← Dashboard</button>
          <p className={styles.kicker}>TEAM PROTOTYPE · PUBLIC-SAFE</p>
          <h1 id="builder-title">Builder View</h1>
          <p>
            Select any stop to see what a user experiences, what is simulated, and how
            information would move through the product.
          </p>
        </div>
        <div className={styles.builderBoundary}>
          <strong>No access control in this slice</strong>
          <span>No secrets, customer data, precise coordinates, or production controls.</span>
        </div>
      </div>

      <p className={styles.storageError} role="alert" aria-live="assertive">
        {storageError}
      </p>

      <div className={styles.builderLayout}>
        <div className={styles.mapColumn}>
          <div className={styles.mapHeading}>
            <h2>Journey map</h2>
            <span>{BUILDER_ITEMS.length} inspectable items</span>
          </div>
          <ol className={styles.builderMap}>
            {BUILDER_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={selected.id === item.id ? styles.mapItemSelected : ""}
                  aria-pressed={selected.id === item.id}
                  onClick={() => selectItem(item.id)}
                >
                  <span className={styles.mapSequence}>{item.sequence}</span>
                  <span className={styles.mapItemCopy}>
                    <small>{item.journeyLabel}</small>
                    <strong>{item.title}</strong>
                    <StatusBadge status={item.status} />
                  </span>
                  <span className={styles.mapArrow} aria-hidden="true">→</span>
                </button>
              </li>
            ))}
          </ol>
          <button
            className={styles.resetAll}
            type="button"
            onClick={onResetAll}
            disabled={Object.keys(feedback).length === 0}
          >
            Reset all device feedback
          </button>
        </div>

        <article
          ref={detailRef}
          className={styles.detailPanel}
          aria-labelledby="detail-title"
          tabIndex={-1}
        >
          <div className={styles.detailHeader}>
            <div>
              <p className={styles.cardEyebrow}>{selected.journeyLabel}</p>
              <h2 id="detail-title">{selected.title}</h2>
            </div>
            <StatusBadge status={selected.status} />
          </div>

          <p className={styles.statusReason}>{selected.reason}</p>

          <div className={styles.detailTruths}>
            <div>
              <span>WHAT THE USER SEES · WHY IT MATTERS</span>
              <p>{selected.userView}</p>
            </div>
            <div>
              <span>REAL OR SIMULATED?</span>
              <p>{selected.reality}</p>
            </div>
          </div>

          <div className={styles.flowSection}>
            <span className={styles.sectionLabel}>SMALL DATA FLOW</span>
            <DataFlow steps={selected.dataFlow} />
          </div>

          <div className={styles.openAction}>
            {selected.id === "entry" ? (
              <Link className={styles.primaryButton} href="/">
                {selected.actionLabel} <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <button className={styles.primaryButton} type="button" onClick={() => onOpenPreview(selected)}>
                {selected.actionLabel} <span aria-hidden="true">↗</span>
              </button>
            )}
            <span>
              {selected.status === "Working now"
                ? "Leaves the dashboard for the real route."
                : "Opens a labeled sample inside this dashboard."}
            </span>
          </div>

          <FeedbackForm
            key={`${selected.id}:${feedback[selected.id]?.recordedAt ?? "new"}`}
            item={selected}
            saved={feedback[selected.id]}
            onSave={(value) => onSaveFeedback(selected.id, value)}
            onReset={() => onResetFeedback(selected.id)}
          />
        </article>
      </div>
    </section>
  );
}

function PreviewDialog({ item, onClose }: { item: BuilderItem; onClose: () => void }) {
  return (
    <AccessibleDialog
      titleId="preview-title"
      descriptionId="preview-description"
      onClose={onClose}
    >
      <div className={styles.previewHeader}>
        <div>
          <StatusBadge status={item.status} />
          <h2 id="preview-title">{item.title}</h2>
        </div>
        <button className={styles.textButton} type="button" onClick={onClose} data-autofocus>
          Close
        </button>
      </div>
      <p id="preview-description" className={styles.previewDescription}>
        {item.reality}
      </p>
      <ItemVisual itemId={item.id} />
    </AccessibleDialog>
  );
}

function formatRecordedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isItemId(value: string): value is ItemId {
  return ITEM_IDS.includes(value as ItemId);
}

function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return typeof value === "string" && FEEDBACK_OPTIONS.includes(value as FeedbackStatus);
}

function isSavedFeedback(value: unknown): value is SavedFeedback {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.reviewer === "string" &&
    candidate.reviewer.trim().length > 0 &&
    candidate.reviewer.length <= 80 &&
    isFeedbackStatus(candidate.status) &&
    typeof candidate.comment === "string" &&
    candidate.comment.length <= 1000 &&
    typeof candidate.recordedAt === "string" &&
    !Number.isNaN(new Date(candidate.recordedAt).getTime())
  );
}

function loadFeedback(): { feedback: FeedbackStore; error: string } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { feedback: {}, error: "" };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { feedback: {}, error: "" };
    }

    const feedback: FeedbackStore = {};
    for (const [itemId, value] of Object.entries(parsed)) {
      if (isItemId(itemId) && isSavedFeedback(value)) {
        feedback[itemId] = value;
      }
    }
    return { feedback, error: "" };
  } catch {
    return {
      feedback: {},
      error: "Saved device feedback could not be read in this browser. Nothing was sent or changed elsewhere.",
    };
  }
}

export function LearningDashboard() {
  const [mode, setMode] = useState<"dashboard" | "guide" | "builder">("dashboard");
  const [guideStep, setGuideStep] = useState(0);
  const [previewItem, setPreviewItem] = useState<BuilderItem | null>(null);
  const [feedback, setFeedback] = useState<FeedbackStore>({});
  const [announcement, setAnnouncement] = useState("");
  const [storageError, setStorageError] = useState("");
  const guideOpenerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const loaded = loadFeedback();
      setFeedback(loaded.feedback);
      setStorageError(loaded.error);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const returnToDashboard = useCallback((message: string) => {
    setMode("dashboard");
    setAnnouncement(message);
    window.requestAnimationFrame(() => guideOpenerRef.current?.focus());
  }, []);

  const closeGuide = useCallback(() => {
    returnToDashboard("Guide closed. You can replay it at any time.");
  }, [returnToDashboard]);

  const skipGuide = useCallback(() => {
    returnToDashboard("Guide skipped. No product data was changed.");
  }, [returnToDashboard]);

  const completeGuide = useCallback(() => {
    returnToDashboard("Four-step guide complete. You can replay it at any time.");
  }, [returnToDashboard]);

  const closePreview = useCallback(() => setPreviewItem(null), []);

  function persistFeedback(next: FeedbackStore): { ok: true } | { ok: false; error: string } {
    try {
      if (Object.keys(next).length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      setFeedback(next);
      setStorageError("");
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: "Feedback could not be saved on this device. Your review remains unsaved and was not sent anywhere.",
      };
    }
  }

  function startGuide() {
    setGuideStep(0);
    setMode("guide");
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {mode === "dashboard" ? (
          <ModeChooser
            onStartGuide={startGuide}
            onOpenBuilder={() => setMode("builder")}
            announcement={announcement}
          />
        ) : null}

        {mode === "builder" ? (
          <BuilderView
            onBack={() => setMode("dashboard")}
            feedback={feedback}
            onSaveFeedback={(itemId, value) => {
              persistFeedback({ ...feedback, [itemId]: value });
              setAnnouncement(`Feedback saved for ${itemId} on this device only.`);
            }}
            onResetFeedback={(itemId) => {
              const next = { ...feedback };
              delete next[itemId];
              persistFeedback(next);
              setAnnouncement(`Device feedback reset for ${itemId}.`);
            }}
            onResetAll={() => {
              persistFeedback({});
              setAnnouncement("All Learning Dashboard feedback was reset on this device.");
            }}
            onOpenPreview={setPreviewItem}
          />
        ) : null}
      </div>

      {mode === "guide" ? (
        <GuideDialog
          stepIndex={guideStep}
          onStepChange={setGuideStep}
          onClose={closeGuide}
          onSkip={skipGuide}
          onComplete={completeGuide}
        />
      ) : null}

      {previewItem ? <PreviewDialog item={previewItem} onClose={closePreview} /> : null}
    </main>
  );
}
