# 08 — Tackle Box

**Status:** Built as a session-only web prototype · **Date:** 2026-08-30

## Job

Before a trip, an angler needs to name the lures they actually carry once, then find the
right one quickly when setting a rig. The page is a personal lure library, not a product
catalogue, social feed, or fishing-performance dashboard.

## First slice

- `/tackle` lists explicit local fixtures and any lures added during the open browser
  session. It states clearly that nothing is synced or saved after a refresh.
- Favorites form a compact horizontal "Ready to rig" rail, followed by the complete
  library. A favorite button remains independent from the card content so a wet-finger
  mis-tap cannot accidentally open or edit an item.
- Search covers name, canonical class, color, and size. All/Salt/Fresh filters retain
  all-water lures in either water view.
- Add lure uses a native modal dialog: user name and canonical lure class are required;
  color and size are optional. A short chip set serves the common choices and a native
  select exposes the full vocabulary. The dialog has a labeled 48px close action and a
  68px primary action.

## Scope boundary

`tackle_item` already carries only the personal lure name, canonical `lure_class`, optional
color/size, and favorite state. Rod, reel, line, and leader are the separate Roadmap A5
gear-loadout proposal; this page does not add or imply those fields. Persistence is deferred
until the offline store/query lane is available, so views never reach Supabase directly.

## Phone and accessibility rules

- Every interactive target is 48px or larger; primary add/save action is 68px.
- Filter and class choices are real buttons with `aria-pressed`; favorite state is readable
as text, not color alone. Search has a visible label and validation connects errors to the
field.
- The native dialog owns focus while open; Escape and the visible Close button both return
the user to the page. No core action relies on a gesture, and nonessential transitions honor
reduced motion.
- At 320px, controls wrap rather than compress below the touch floor. The favorites rail is
the only intentional horizontal scroll, a secondary browsing convenience rather than the
sole route to any item.
