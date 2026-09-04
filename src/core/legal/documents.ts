/**
 * The three legal documents, as data.
 *
 * They live in `core/` because they are content, not UI: no I/O, no clock, no DOM. That
 * also makes them testable — `documents.test.ts` asserts the promises made here still
 * match the code that keeps them, which is the only way a privacy notice stays true as
 * the app grows.
 *
 * **These are drafts by an engineer, not by an attorney.** They are honest and specific,
 * which is most of what a small app needs, but nobody here is licensed. A real lawyer
 * should read them before the app is offered to the public. That sentence is in the
 * repository rather than only in a chat log on purpose.
 */

/**
 * Bumped whenever the substance of any document changes. The Fish Legal acknowledgement
 * is stored against this value, so a substantive change asks again; a typo fix should
 * NOT bump it, because re-asking everyone for a comma is how people learn to click
 * through without reading.
 */
export const LEGAL_VERSION = "2026-09-04";

/**
 * The details only the founder can supply. `resolved: false` makes the gap visible in the
 * UI instead of shipping a plausible-looking lie — the same stance the conditions code
 * takes with "No verified data". Fill these in and flip the flag; nothing else changes.
 */
export const LEGAL_CONTACT = {
  resolved: false,
  /** Legal entity that publishes the app. A person's name is fine if there is no company. */
  entity: "the publisher of Fish Log Book",
  /** Where a user sends a privacy or terms question. */
  email: "",
  /** Whose law governs the Terms, and where disputes are heard. */
  jurisdiction: "the State of California, United States",
} as const;

export interface LegalSection {
  readonly heading: string;
  readonly paragraphs?: readonly string[];
  readonly bullets?: readonly string[];
}

export interface LegalDocument {
  readonly id: LegalDocumentId;
  /** URL segment under /legal. */
  readonly slug: string;
  readonly title: string;
  /** One line for the index and the page metadata. */
  readonly summary: string;
  readonly effective: string;
  readonly sections: readonly LegalSection[];
}

export type LegalDocumentId = "regulations" | "terms" | "privacy";

/* ------------------------------------------------------------------ *
 * 1. Fishing regulations notice
 * ------------------------------------------------------------------ */

const REGULATIONS: LegalDocument = {
  id: "regulations",
  slug: "regulations",
  title: "About the fishing rules in this app",
  summary: "Fish Legal is a reading aid. The agency's own publication is the law.",
  effective: LEGAL_VERSION,
  sections: [
    {
      heading: "The short version",
      paragraphs: [
        "Fish Legal is a reading aid for published fishing regulations. It is not the regulations, and it is not legal advice. Before you keep a fish, check the rule against the agency that wrote it — every rule in this app carries a link to its official source for exactly that reason.",
        "You are responsible for fishing legally. A number on this screen is not a defence.",
      ],
    },
    {
      heading: "Where the rules come from",
      paragraphs: [
        "Each region's rules are packaged as a dated, versioned pack built from that state or agency's own publication. Every card shows which agency said it, and when we last checked. Nothing in Fish Legal is folklore, a forum post, or a guess: a region with no verified pack shows no rules at all rather than approximate ones.",
      ],
    },
    {
      heading: "Why it can still be wrong",
      paragraphs: ["Honest limits, all of which apply even when the app is working perfectly:"],
      bullets: [
        "A pack is a snapshot. Regulations change in season, and emergency closures can take effect the same day they are announced — before any pack can be rebuilt and delivered to your phone.",
        "Answers follow the region selected in Settings, not your GPS. When the two disagree the app says so, but it does not overrule you.",
        "Boundary and depth lines are drawn from published coordinates and rendered at the precision of your device's GPS. Near a line, the app cannot tell you which side you are on with legal certainty. Neither can your chartplotter.",
        "Rules depend on facts the app cannot see: how the fish was taken, what gear was aboard, whether you hold a permit or report card, and the difference between a vessel limit and a personal one.",
        "Identification is the angler's call. Every limit assumes you named the fish correctly.",
      ],
    },
    {
      heading: "The identification tools",
      paragraphs: [
        "Rockfish ID, Fish ID, and Whale & Dolphin ID answer with likelihoods, never verdicts. They narrow a field; they do not confirm a species, and they are not a substitute for a warden, a biologist, or an official identification guide.",
        "When a possible answer is a protected, prohibited, or closely regulated species, the tool says so even at low confidence — because the cost of the two mistakes is not the same.",
      ],
    },
    {
      heading: "Marine mammals",
      paragraphs: [
        "Whales, dolphins, porpoises, seals, and sea lions are protected under the U.S. Marine Mammal Protection Act, and some populations additionally under the Endangered Species Act. The viewing distances shown in Whale & Dolphin ID are the general federal guidance and are provided for information only.",
        "Local, state, and species-specific rules can be stricter, and approach limits near some populations are legally binding. Follow NOAA Fisheries and your local authority. Never pursue, feed, or attempt to swim with a marine mammal.",
      ],
    },
    {
      heading: "If you find a mistake",
      paragraphs: [
        "Tell us. A wrong rule is the most serious defect this app can have, and it is fixed ahead of anything else.",
      ],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 2. Terms of use
 * ------------------------------------------------------------------ */

const TERMS: LegalDocument = {
  id: "terms",
  slug: "terms",
  title: "Terms of Use",
  summary: "What this app is, what it is not, and the terms you accept by using it.",
  effective: LEGAL_VERSION,
  sections: [
    {
      heading: "1. Accepting these terms",
      paragraphs: [
        "By using Fish Log Book you agree to these Terms of Use. If you do not agree, do not use the app. If you use the app on behalf of somebody else — a charter operation, a club, a crew — you confirm that you may accept these terms for them.",
        "You must be at least 13 years old to use the app.",
      ],
    },
    {
      heading: "2. What the app is",
      paragraphs: [
        "Fish Log Book is a personal fishing logbook. It records the fish you catch and the conditions you caught them in, and it includes informational aids: published fishing regulations, tide predictions, sun and moon times, and species identification tools.",
        "Everything in the app is provided for information only.",
      ],
    },
    {
      heading: "3. Not legal advice, and not the law",
      paragraphs: [
        "The regulations shown in Fish Legal are a reading aid drawn from public agency publications. They are not legal advice, not an official statement of the law, and not a substitute for the agency's own publication. Regulations change, sometimes without notice and sometimes the same day.",
        "You are solely responsible for fishing legally, holding the licences and permits your fishery requires, correctly identifying what you catch, and complying with every limit that applies to you. Verify against the official source before you keep, land, or transport a fish.",
      ],
    },
    {
      heading: "4. Not for navigation or safety",
      paragraphs: [
        "Nothing in this app may be used for navigation. Tide predictions, boundary lines, depth contours, positions, and charts are approximate, are not corrected for weather or local conditions, and are not a navigational chart. Use official charts, official tide tables, and proper marine electronics.",
        "The app is not a safety device. It will not summon help, and it must never be relied on in an emergency. Carry a VHF radio, an EPIRB or PLB, and the safety equipment your vessel requires.",
      ],
    },
    {
      heading: "5. Wildlife",
      paragraphs: [
        "Marine mammals are protected by federal law. Viewing distances and identification guidance in this app are informational; the law, and the authority enforcing it, is not this app. See the fishing rules notice for detail.",
      ],
    },
    {
      heading: "6. Your log is yours",
      paragraphs: [
        "You keep every right you have in the catches, notes, photographs, and records you enter. We claim no ownership of them, and we do not sell them or use them to advertise to you.",
        "If you sign in, you grant us only the permission needed to run the service for you: storing your records, syncing them between your own devices, and backing them up. That permission ends when you delete the records or your account.",
      ],
    },
    {
      heading: "7. Using the app fairly",
      paragraphs: ["Do not:"],
      bullets: [
        "Use the app to break the law, or to help anybody else break it.",
        "Attempt to access another person's log or account.",
        "Scrape, bulk-export, or resell the regulation data, species data, or identification content.",
        "Interfere with the service, or with the public data sources the app relies on.",
      ],
    },
    {
      heading: "8. The app is provided as-is",
      paragraphs: [
        "Fish Log Book is provided “as is” and “as available”, without warranties of any kind, express or implied, including any implied warranty of merchantability, fitness for a particular purpose, accuracy, or non-infringement.",
        "We do not warrant that the app will be available, uninterrupted, or error-free, that regulations shown are current or complete, or that tide, sun, moon, or identification results are accurate.",
      ],
    },
    {
      heading: "9. Limitation of liability",
      paragraphs: [
        "To the fullest extent the law allows, we are not liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of data, catch, property, income, or opportunity, arising from your use of the app.",
        "This includes — and we name them because they are the ones that matter here — any fine, citation, seizure, licence action, or prosecution arising from a fishing regulation, and any loss or injury arising from reliance on tide, position, boundary, weather, or identification information in the app.",
        "Some jurisdictions do not allow these exclusions, in which case they apply to you only as far as that jurisdiction permits.",
      ],
    },
    {
      heading: "10. Changes, and ending",
      paragraphs: [
        "We may change the app or these terms. When a change is substantive, the app asks you to acknowledge the new version. Continuing to use the app after that means you accept it.",
        "You may stop using the app at any time; deleting it removes the log stored on that device. We may suspend or end access that breaks these terms.",
      ],
    },
    {
      heading: "11. Governing law",
      paragraphs: [
        "These terms are governed by the laws of the jurisdiction named at the foot of this page, without regard to its conflict-of-laws rules.",
      ],
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 3. Privacy notice
 * ------------------------------------------------------------------ */

const PRIVACY: LegalDocument = {
  id: "privacy",
  slug: "privacy",
  title: "Privacy Notice",
  summary: "Your log lives on your phone. Two things leave it, and this says exactly what.",
  effective: LEGAL_VERSION,
  sections: [
    {
      heading: "The short version",
      paragraphs: [
        "Fish Log Book is built offline-first, which has a privacy consequence worth stating plainly: your fishing log is stored on your device, and the app works with no network at all.",
        "There is no analytics, no advertising, no tracking, and no third-party marketing or measurement code anywhere in the app. That is not a promise about intent — it is a fact about the code, and you can check it in the dependency list.",
      ],
    },
    {
      heading: "What is stored on your device",
      bullets: [
        "Your log: trips, catches, species, measurements, gear and rigs, spots, tackle, journal entries, and the conditions recorded with each catch — including GPS coordinates, when you have allowed location access.",
        "Your settings: region, units, tide station, and which shortcuts you have turned on.",
        "Cached tide predictions for your chosen station, so the chart still works offshore.",
        "Fish Legal alerts, which are generated and kept on the device.",
        "This stays on your phone unless you sign in. Deleting the app deletes it.",
      ],
    },
    {
      heading: "If you sign in",
      paragraphs: [
        "Signing in is optional. The app is fully usable without an account; signing in is what lets your log survive a lost phone and follow you to a new one.",
      ],
      bullets: [
        "We send your email address to Supabase, our hosted database and authentication provider, so it can email you a sign-in link. We do not set a password, and we never see one.",
        "Once signed in, your log syncs to our database: trips, catches, gear, spots, tackle, journal entries, and condition snapshots — including the GPS coordinates stored with them.",
        "Supabase processes this on our behalf under its own terms and security controls. We do not share your log with anyone else.",
      ],
    },
    {
      heading: "Location",
      paragraphs: [
        "The app asks for your location only when you tap something that needs it — recording where a catch happened, or checking which jurisdiction and boundary you are inside.",
        "Boundary checking happens entirely on your device: the boundary shapes are bundled with the app, and the map draws no tiles from any outside server, so looking at where you are does not tell anyone where you are.",
        "Coordinates saved with a catch are part of your log, and sync with it if you are signed in. You can refuse or revoke location permission in your phone's settings; the app keeps working, with less precision in Fish Legal.",
      ],
    },
    {
      heading: "The one outside service the app calls",
      paragraphs: [
        "Tide predictions come from the NOAA Tides & Currents public API. Your device requests them directly, which means NOAA sees the request — including your device's IP address, as with any web request.",
        "We send NOAA a station identifier and a date range. We do not send your identity, your account, your log, or your GPS position.",
        "Species photographs, boundary shapes, regulation packs, and the sun and moon calculations are all bundled with the app or computed on your device. They make no network requests at all.",
      ],
    },
    {
      heading: "What we do not do",
      bullets: [
        "We do not sell or rent your personal information.",
        "We do not use your log for advertising, and we show no advertising.",
        "We do not run analytics, session recording, fingerprinting, or crash reporting SDKs.",
        "We do not track you across other apps or websites.",
      ],
    },
    {
      heading: "How long it is kept",
      paragraphs: [
        "Local data stays until you delete it or remove the app. If you are signed in, synced records are kept until you delete them or ask us to close your account, after which they are removed from our active database within 30 days and from backups on that backup's normal rotation.",
      ],
    },
    {
      heading: "Your choices",
      bullets: [
        "Use the app without ever signing in, and nothing leaves your device except tide requests.",
        "Refuse location permission, and no coordinates are recorded.",
        "Ask us for a copy of what is stored under your account, or ask us to delete it. Write to the address at the foot of this page.",
        "If you are in California, the EU, or the UK, you have additional statutory rights over your personal data — including access, correction, deletion, and portability. We honour these requests from everyone, wherever you are.",
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        "The app is not directed at children under 13, and we do not knowingly collect their personal information. If you believe a child has given us information, write to us and we will delete it.",
      ],
    },
    {
      heading: "Changes to this notice",
      paragraphs: [
        "If we change what the app collects or where it sends it, we update this notice and the app asks you to acknowledge the new version. The effective date is at the top of this page.",
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [REGULATIONS, TERMS, PRIVACY];

export function legalDocument(slug: string): LegalDocument | null {
  return LEGAL_DOCUMENTS.find((doc) => doc.slug === slug) ?? null;
}
