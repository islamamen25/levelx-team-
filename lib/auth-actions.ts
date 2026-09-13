"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/safe-redirect";

export type AuthActionState = {
  error?: string;
  /** Sign-up only: Supabase returned no session, meaning email confirmation
   *  is required before the account can sign in. */
  needsConfirmation?: boolean;
};

const messages = {
  en: {
    invalidCredentials: "Invalid email or password",
    emailNotConfirmed: "Please confirm your email first — check your inbox for the link",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 8 characters",
    emailInUse: "An account with this email already exists",
    generic: "Something went wrong — please try again",
  },
  ar: {
    invalidCredentials: "بيانات الدخول غير صحيحة",
    emailNotConfirmed: "يرجى تأكيد بريدك الإلكتروني أولاً — تفقّد بريدك الوارد",
    passwordMismatch: "كلمتا المرور غير متطابقتين",
    passwordTooShort: "كلمة المرور يجب ألا تقل عن 8 أحرف",
    emailInUse: "يوجد حساب بهذا البريد الإلكتروني بالفعل",
    generic: "حدث خطأ ما — حاول مرة أخرى",
  },
} as const;

function t(locale: string, key: keyof typeof messages.en) {
  return (locale === "ar" ? messages.ar : messages.en)[key];
}

// Reconstructs the deployment origin from request headers rather than
// hardcoding it — Server Actions have no `window`, and this needs to work for
// both localhost dev and the Vercel production domain without an env var.
async function currentOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${proto}://${host}`;
}

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function signInAction(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: t(locale, "invalidCredentials") };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    const notConfirmed = error?.message.toLowerCase().includes("not confirmed");
    return { error: t(locale, notConfirmed ? "emailNotConfirmed" : "invalidCredentials") };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const next = sanitizeNextPath(String(formData.get("next") ?? ""), `/${locale}`);
  redirect(profile?.role === "admin" ? `/${locale}/dashboard` : next);
}

// role is never accepted from the form — every sign-up becomes 'user' (the
// storefront customer role in profiles.role_check) via the handle_new_user()
// trigger (supabase/migrations/0009_customer_signup_profile.sql). Only an
// existing admin editing the row directly can promote an account.
const signUpSchema = z
  .object({
    fullName: z.string().trim().min(1).max(200),
    email: z.string().trim().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
  });

export async function signUpAction(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const passwordTooShort = parsed.error.issues.some((i) => i.path[0] === "password");
    return {
      error: passwordTooShort
        ? t(locale, "passwordTooShort")
        : t(locale, "passwordMismatch"),
    };
  }

  const { fullName, email, password } = parsed.data;
  const origin = await currentOrigin();
  const next = sanitizeNextPath(String(formData.get("next") ?? ""), `/${locale}`);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return {
      error: error.message.toLowerCase().includes("already registered")
        ? t(locale, "emailInUse")
        : t(locale, "generic"),
    };
  }

  // Supabase returns no session when email confirmation is required — the
  // account exists (handle_new_user() already gave it a profiles row) but
  // can't sign in until the link is followed.
  if (!data.session) {
    return { needsConfirmation: true };
  }

  redirect(next);
}

export async function signOutAction(locale: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}
