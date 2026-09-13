import { AuthForms } from "@/components/auth/auth-forms";
import { sanitizeNextPath } from "@/lib/safe-redirect";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; next?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "تسجيل الدخول — LevelX" : "Sign in — LevelX",
  };
}

// Fallback, non-drawer entry point. The AuthDrawer (opened from the Navbar's
// user icon — components/layout/navbar.tsx) is the primary path; this page
// exists because some things can only land on a full page: the password-reset
// email link, an OAuth provider error redirect
// (app/api/auth/callback/route.ts), and a signed-in non-admin bounced out of
// /dashboard by (admin)/layout.tsx. No "admin"/"dashboard" wording here —
// this is the same customer-facing sign-in/up UI as the drawer.
export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error, next: rawNext } = await searchParams;
  const next = sanitizeNextPath(rawNext, `/${locale}`);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white pt-24 pb-12">
      <div className="w-full max-w-sm px-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {locale === "ar"
              ? "تعذّر تسجيل الدخول — حاول مرة أخرى"
              : "Could not sign you in — please try again"}
          </div>
        )}

        <AuthForms locale={locale} next={next} />
      </div>
    </div>
  );
}
