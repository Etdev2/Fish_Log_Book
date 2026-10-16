"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Google sign in, with a magic link underneath for anglers without a Google account.
 * src/app/(auth)/** is one of the three places allowed to import @supabase/* outside a
 * feature query layer (ADR 005 §5).
 *
 * No password field: on a boat, in the sun, one-handed, a password field is the wrong
 * control, and passwords are one more thing for a solo founder to secure. Both paths end
 * at /callback, which swaps the returned code for a session cookie.
 */
export default function SignInPage() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "redirecting" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onGoogle() {
    setState("redirecting");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/callback` },
    });

    // On success the browser is already navigating to Google; only a failure lands here.
    if (error) {
      setState("error");
      setMessage(error.message);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    if (typeof email !== "string" || email.length === 0) return;

    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/callback` },
    });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }
    setState("sent");
  }

  return (
    <main>
      <h1 className="text-h1">Fish Log Book</h1>
      <p className="mt-3 text-body text-text-muted">
        Sign in with Google, or enter your email and we&apos;ll send you a link that signs
        you in.
      </p>

      <Suspense>
        <CallbackError />
      </Suspense>

      <button
        type="button"
        onClick={onGoogle}
        disabled={state === "redirecting"}
        className="mt-8 flex min-h-touch-primary-standard w-full items-center justify-center gap-3 rounded-md border border-border-interactive bg-surface px-4 text-label text-text-primary"
      >
        <GoogleMark />
        {state === "redirecting" ? "Opening Google…" : "Continue with Google"}
      </button>

      <p className="mt-6 text-center text-caption text-text-muted">or use your email</p>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        <label htmlFor="email" className="text-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="min-h-touch-floor rounded-md border border-border-interactive bg-surface px-4 text-body text-text-primary"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="min-h-touch-primary-standard rounded-md bg-signal-orange px-4 text-label text-ink-on-orange"
        >
          {state === "sending" ? "Sending…" : "Send me a link"}
        </button>
      </form>

      {/*
        Consent at the point the email is handed over, which is the first moment anything
        leaves the device. Signing in is optional — the app works fully signed out — so
        this is the one place a terms link genuinely has to be.
      */}
      <p className="mt-4 text-caption text-text-muted">
        By signing in you agree to our Terms of Use and Privacy Notice. Your email is used
        to sign you in and to hold your account; it is never sold or used for advertising.
      </p>
      {/* UI-1 #13: 48 px link rows instead of 17 px inline links. */}
      <p className="mt-1 flex flex-wrap gap-x-6 text-caption">
        <Link
          href="/legal/terms"
          className="inline-flex min-h-touch-floor items-center text-text-link underline decoration-dotted underline-offset-2"
        >
          Terms of Use
        </Link>
        <Link
          href="/legal/privacy"
          className="inline-flex min-h-touch-floor items-center text-text-link underline decoration-dotted underline-offset-2"
        >
          Privacy Notice
        </Link>
      </p>

      {state === "sent" && (
        <p className="mt-6 text-body text-success-green">
          Check your email — the link signs you in on this device.
        </p>
      )}
      {state === "error" && (
        <p className="mt-6 text-body text-error-red">
          That didn&apos;t work: {message}. Try again.
        </p>
      )}
    </main>
  );
}

const CALLBACK_ERRORS: Record<string, string> = {
  cancelled: "Google sign-in didn't finish. Try again, or use your email instead.",
  missing_code: "That sign-in link was incomplete. Ask for a new one.",
  exchange_failed:
    "That sign-in didn't go through. Open the link on the same device you asked from, or try again.",
};

/**
 * /callback bounces failures back here as ?error=. Reading the query string is the only
 * dynamic part of the page, so it sits in its own Suspense boundary and the rest still
 * prerenders (node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md).
 */
function CallbackError() {
  const code = useSearchParams().get("error");
  const text = code ? CALLBACK_ERRORS[code] : undefined;
  if (!text) return null;
  return (
    <p role="alert" className="mt-6 text-body text-error-red">
      {text}
    </p>
  );
}

/** Google's standard "G", as its sign-in branding guidelines require on the button. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
