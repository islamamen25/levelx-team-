import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/safe-redirect";

// Not locale-scoped — same as every other route under app/api (see
// CLAUDE.md §4). That matters here specifically: proxy.ts's matcher excludes
// "api", so next-intl's middleware never tries to inject a locale prefix into
// this path. If this lived under app/[locale]/, the OAuth provider's
// callback hit would race the locale-detection redirect.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next"), "/");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // proxy.ts adds the default locale prefix on the next request, so a bare
  // "/login" here is enough — it does not need to know which locale the user
  // was on.
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
