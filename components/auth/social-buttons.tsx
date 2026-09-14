"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  /** Where the OAuth callback should land the user once the session exists. */
  next: string;
}

// Apple isn't enabled in the Supabase dashboard yet (needs a paid Apple
// Developer account) — showing the button would just hand every customer a
// 400 error. The handler below still supports "apple"; flip this back to
// true once the provider is configured there. Do not remove the branch.
const APPLE_ENABLED = false;

/**
 * "Continue with Google/Apple" — full-page redirect, so this has to run
 * client-side (a Server Action cannot navigate the browser to an external
 * provider). Uses the cookie-backed client from lib/supabase/client.ts, not
 * the localStorage singleton — see that file for why.
 */
export function SocialAuthButtons({ next }: Props) {
  const t = useTranslations("auth");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setLoading(provider);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      // Reachable when the provider isn't configured in the Supabase
      // dashboard (client IDs live there, never in this app — see
      // CLAUDE.md/the drawer plan). Surface it rather than hanging on a
      // spinner that will never navigate.
      setError(error.message);
      setLoading(null);
    }
    // On success the browser navigates away immediately; no further state update needed.
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => handleOAuth("google")}
        className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--color-iron)] bg-white text-sm font-semibold text-[var(--color-ceramic)] transition-colors hover:bg-[var(--color-graphite)] disabled:opacity-50"
      >
        <GoogleIcon className="h-[18px] w-[18px]" />
        {t("continueWithGoogle")}
      </button>
      {APPLE_ENABLED && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => handleOAuth("apple")}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--color-iron)] bg-white text-sm font-semibold text-[var(--color-ceramic)] transition-colors hover:bg-[var(--color-graphite)] disabled:opacity-50"
        >
          <AppleIcon className="h-[18px] w-[18px]" />
          {t("continueWithApple")}
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.61 4.59 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.1C6.22 6.87 8.87 4.76 12 4.76Z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.462 2.213-1.223 3.03-.833.895-2.15 1.583-3.25 1.494-.14-1.106.44-2.27 1.19-3.035C13.85.86 15.302.11 16.365 0v1.43ZM20.64 17.45c-.39.9-.85 1.75-1.44 2.53-.8 1.05-1.45 1.78-2.44 1.79-.97.02-1.29-.62-2.4-.62-1.12 0-1.47.6-2.39.64-.95.04-1.68-1.14-2.49-2.19-1.63-2.13-2.88-6.02-1.2-8.65.83-1.3 2.32-2.13 3.94-2.15.94-.02 1.83.63 2.4.63.57 0 1.65-.78 2.79-.66.48.02 1.82.19 2.68 1.46-.07.04-1.6.93-1.58 2.79.02 2.22 1.95 2.96 1.97 2.97-.02.05-.31 1.06-1.03 2.09Z" />
    </svg>
  );
}
