import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

/**
 * Cookie-backed browser client — deliberately NOT the `supabase` singleton in
 * `lib/supabase.ts` (plain `createClient` from `@supabase/supabase-js`, which
 * keeps its session in localStorage). Two things need a client whose session
 * lives in a cookie instead:
 *
 * 1. OAuth (`signInWithOAuth`): the PKCE code_verifier has to be readable by
 *    `app/api/auth/callback/route.ts`, which runs server-side and can only see
 *    cookies, never localStorage.
 * 2. The Navbar's signed-in/out state: it renders inside the static storefront
 *    shell (no server-side auth check there — see the note in
 *    `components/layout/navbar.tsx`), so it has to read whatever the last
 *    Server Action (sign in/up/out) already wrote to cookies at mount.
 *
 * Password sign-in/up don't need this client at all — they run as Server
 * Actions against `createSupabaseServerClient()` and get their session cookie
 * from that.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
