"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Magic-link sign in. src/app/(auth)/** is one of the three places allowed to import
 * @supabase/* outside a feature query layer (ADR 005 §5).
 *
 * A link rather than a password: on a boat, in the sun, one-handed, a password field is
 * the wrong control, and passwords are one more thing for a solo founder to secure.
 */
export default function SignInPage() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

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
        Enter your email and we&apos;ll send you a link that signs you in.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
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

      {state === "sent" && (
        <p className="mt-6 text-body text-success-green">
          Check your email — the link signs you in on this device.
        </p>
      )}
      {state === "error" && (
        <p className="mt-6 text-body text-error-red">
          That didn&apos;t send: {message}. Check the address and try again.
        </p>
      )}
    </main>
  );
}
