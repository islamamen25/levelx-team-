import { login } from "./actions";
import { ForgotPassword } from "@/components/auth/forgot-password";
import { PasswordInput } from "@/components/auth/password-input";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "تسجيل الدخول — LevelX" : "Sign in — LevelX",
  };
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { error } = await searchParams;
  const loginAction = login.bind(null, locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white pt-24 pb-12">
      <div className="w-full max-w-sm px-6">
        <h1 className="mb-1 text-2xl font-extrabold text-[var(--color-ceramic)]">
          {locale === "ar" ? "تسجيل الدخول" : "Sign in"}
        </h1>
        <p className="mb-6 text-sm text-[var(--color-slate)]">
          {locale === "ar"
            ? "الوصول إلى لوحة تحكم LevelX"
            : "Access the LevelX admin dashboard"}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {locale === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid email or password"}
          </div>
        )}

        <form action={loginAction} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-semibold text-[var(--color-ceramic)]"
            >
              {locale === "ar" ? "البريد الإلكتروني" : "Email"}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              className="w-full rounded-xl border border-[var(--color-iron)] px-4 py-2.5 text-sm text-[var(--color-ceramic)] focus:border-[var(--color-mint)] focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-semibold text-[var(--color-ceramic)]"
            >
              {locale === "ar" ? "كلمة المرور" : "Password"}
            </label>
            <PasswordInput
              id="password"
              name="password"
              locale={locale}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-[var(--color-mint)] py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-mint-hover)]"
          >
            {locale === "ar" ? "دخول" : "Sign in"}
          </button>
        </form>

        <div className="flex flex-col items-center">
          <ForgotPassword locale={locale} />
        </div>
      </div>
    </div>
  );
}
