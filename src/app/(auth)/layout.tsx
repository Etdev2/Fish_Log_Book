import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in | Fish Log Book" };

/** No product chrome (ADR 005 §4) — chrome is opt-in, and this group opts out. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      {children}
    </div>
  );
}
