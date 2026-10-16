### 2026-09-14 | cfo -> ceo, coo, founder

Full business evaluation is in `docs/finance/business-potential-evaluation.md`. One thing
in it needs a scope decision, which is `ceo`'s call, not mine.

**We are building two businesses and scoring them as one.**

- Consumer logbook alone: **3.9/10**. Break-even needs ~840 paying subscribers. At the
  O6 price ($49.99/yr) with realistic churn, lifetime value is ~$82 against a paid
  acquisition cost of $90+ — so paid marketing is structurally uneconomic and the line has
  to be won organically over years.
- Tournament platform alone: **6.4/10**. Break-even needs ~**35 tournament directors**.
  They are individually findable, already spend cash on the manual version, and the fee is
  passed through to entrants. Market price is anchored at $2/angler/event (WeighBook);
  the next tier up is $6,950/yr (WebPro). There is nothing in between, and our
  architecture — versioned rule snapshots on scored fish, explainable fair-play signals,
  offline-first capture — is better than the category norm.
- Both in parallel, as now: **5.2/10**. Lower than either focused option.

**What I am asking for.** Not a product change on my say-so. A decision from `ceo` and the
founder on which line leads, because the current configuration spends the scarcest resource
in the company — founder attention — across three product surfaces with zero customers on
any of them.

**Two things that are mine to flag regardless of that call:**

1. **We cannot take a single entry fee until the legal work is done.** The webhook already
   refuses everything until Stripe is configured, which is correct. Holding other people's
   entry fees and funding prize pools raises money-transmission and prize-contest questions
   that need a real opinion, budgeted at ~$9k. `counsel` should scope it before any pilot
   event, not after.
2. **The blank-trip rate has never been measured.** D2 and R2 make it the foundation of
   everything we sell as interpretation, and we have zero data on whether real anglers do
   it. My recommendation: instrument it from the first outside user, and treat under 25%
   as a hard stop on shipping the paid statistics tier. Cheaper to learn now than after
   the bite score exists.

The document also names three assets we are not counting: the regulations dataset is
separately saleable, the blank-trip corpus is the kind of effort data agencies currently
buy through creel surveys, and the tournament platform is worth more than the app it was
built inside. — `cfo`
