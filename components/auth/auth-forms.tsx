"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PasswordInput } from "@/components/auth/password-input";
import { ForgotPassword } from "@/components/auth/forgot-password";
import { SocialAuthButtons } from "@/components/auth/social-buttons";
import { signInAction, signUpAction, type AuthActionState } from "@/lib/auth-actions";

interface Props {
  locale: string;
  /** Relative path to land on after a successful sign-in/up. Already
   *  sanitized server-side too (lib/safe-redirect.ts) — this is just the
   *  value the form submits, never trusted on its own. */
  next: string;
  /** "signin" | "signup" — which tab opens first. */
  defaultTab?: "signin" | "signup";
}

const initialState: AuthActionState = {};

const inputClass =
  "w-full rounded-xl border border-[var(--color-iron)] px-4 py-2.5 text-sm text-[var(--color-ceramic)] focus:border-[var(--color-mint)] focus:outline-none";
const labelClass = "mb-1 block text-sm font-semibold text-[var(--color-ceramic)]";

/**
 * The sign-in/sign-up tab pair — shared by the AuthDrawer and the standalone
 * `/login` fallback page (email links, the admin-guard redirect, and OAuth
 * error returns all need a page that works with no drawer mounted).
 */
export function AuthForms({ locale, next, defaultTab = "signin" }: Props) {
  const t = useTranslations("auth");

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-2">
        <TabsTrigger value="signin">{t("signIn")}</TabsTrigger>
        <TabsTrigger value="signup">{t("signUp")}</TabsTrigger>
      </TabsList>

      <TabsContent value="signin">
        <SignInPanel locale={locale} next={next} />
      </TabsContent>
      <TabsContent value="signup">
        <SignUpPanel locale={locale} next={next} />
      </TabsContent>
    </Tabs>
  );
}

function SignInPanel({ locale, next }: { locale: string; next: string }) {
  const t = useTranslations("auth");
  const boundAction = signInAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</div>
      )}

      <div>
        <label htmlFor="signin-email" className={labelClass}>
          {t("email")}
        </label>
        <input
          id="signin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="signin-password" className={labelClass}>
          {t("password")}
        </label>
        <PasswordInput
          id="signin-password"
          name="password"
          locale={locale}
          required
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 w-full rounded-full bg-[var(--color-mint)] py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-mint-hover)] disabled:opacity-50"
      >
        {isPending ? t("signingIn") : t("signInCta")}
      </button>

      <div className="flex justify-center">
        <ForgotPassword locale={locale} />
      </div>

      <Divider label={t("or")} />
      <SocialAuthButtons next={next} />
    </form>
  );
}

function SignUpPanel({ locale, next }: { locale: string; next: string }) {
  const t = useTranslations("auth");
  const boundAction = signUpAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  if (state.needsConfirmation) {
    return (
      <div className="rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
        <p className="font-semibold">{t("checkEmail")}</p>
        <p className="mt-1">{t("checkEmailBody")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</div>
      )}

      <div>
        <label htmlFor="signup-name" className={labelClass}>
          {t("fullName")}
        </label>
        <input
          id="signup-name"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="signup-email" className={labelClass}>
          {t("email")}
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="signup-password" className={labelClass}>
          {t("password")}
        </label>
        <PasswordInput
          id="signup-password"
          name="password"
          locale={locale}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="signup-confirm" className={labelClass}>
          {t("confirmPassword")}
        </label>
        <PasswordInput
          id="signup-confirm"
          name="confirmPassword"
          locale={locale}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 w-full rounded-full bg-[var(--color-mint)] py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-mint-hover)] disabled:opacity-50"
      >
        {isPending ? t("signingUp") : t("signUpCta")}
      </button>

      <Divider label={t("or")} />
      <SocialAuthButtons next={next} />
    </form>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs font-medium text-[var(--color-slate)]">
      <span className="h-px flex-1 bg-[var(--color-iron)]" />
      {label}
      <span className="h-px flex-1 bg-[var(--color-iron)]" />
    </div>
  );
}
