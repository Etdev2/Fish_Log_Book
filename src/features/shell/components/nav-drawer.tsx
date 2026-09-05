"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { destinationGroups } from "../destinations";

/**
 * "Everything" — the drawer that makes the whole app reachable from any screen.
 *
 * A native `<dialog>` opened with `showModal()`, deliberately. It gives Escape-to-close,
 * a focus trap, inertness of the page behind it, and a backdrop, all correct, for free —
 * every one of which is a thing a hand-rolled panel gets subtly wrong and nobody notices
 * until somebody navigates with a keyboard or a screen reader.
 *
 * It slides from the left because that is where the button is and where a drawer is
 * expected. The trigger sits in the header rather than the bottom bar: the bar is full at
 * six and this is a find-something action rather than a do-something one — occasional,
 * often two-handed, and not competing for the thumb's home position with "Log catch".
 *
 * Every item is a full-width row with the name on one line and a plain sentence beneath,
 * because the persona this app is designed for (docs/design/README.md) should not have to
 * infer what "Passport" means from the word alone.
 */
export function NavDrawer() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const groups = destinationGroups();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-h-touch-floor items-center gap-space-2 rounded-md px-space-2 text-label text-text-link transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none"
      >
        {/* Icon and word together. Design 01 §1.3: a symbol is never the only signal. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-space-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
        Menu
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Everywhere you can go"
        onClose={() => setOpen(false)}
        /*
          `onClick` on the dialog itself catches the backdrop: a click whose target IS the
          dialog element (rather than anything inside it) happened on the ::backdrop.
        */
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        className="m-0 h-dvh max-h-dvh w-[min(20rem,85vw)] max-w-none border-r border-hairline bg-background p-0 text-text-primary backdrop:bg-background/70"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-hairline px-space-4 py-space-3">
            <h2 className="text-h3 text-text-primary">Go to</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex min-h-touch-floor items-center rounded-md px-space-3 text-label text-text-link transition-colors hover:bg-surface-raised focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
            >
              Close
            </button>
          </div>

          <nav aria-label="All destinations" className="flex-1 overflow-y-auto px-space-3 py-space-3">
            {groups.map((group) => (
              <section key={group.heading} className="mb-space-5 last:mb-0">
                <h3 className="px-space-2 pb-space-2 text-caption text-text-muted">
                  {group.heading}
                </h3>
                <ul className="flex flex-col gap-space-1">
                  {group.items.map((item) => {
                    const active =
                      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          /*
                            Closing happens here rather than in an effect on `pathname`.
                            That effect was the obvious way to write it and it tripped
                            react-hooks/set-state-in-effect — correctly: setting state
                            synchronously in an effect body is a cascading render, and
                            with the React Compiler on it is the shape that behaves
                            differently from what the code appears to say. Tapping a link
                            IS the event; there is no need to observe its consequence.
                          */
                          onClick={() => setOpen(false)}
                          className={`flex min-h-touch-floor flex-col justify-center rounded-md border-l-2 px-space-3 py-space-2 transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring ${
                            active
                              ? "border-signal-orange bg-surface"
                              : "border-transparent"
                          }`}
                        >
                          <span className="text-body-strong text-text-primary">{item.label}</span>
                          <span className="text-caption text-text-muted">{item.blurb}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}
