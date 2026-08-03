"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Deliberately NOT the shared `supabase` singleton from lib/supabase.ts.
// That one uses default auth options; this form needs persistSession: false,
// because asking for a reset link must never write a session to storage — the
// user is unauthenticated and stays that way until they follow the email link.
// Leave it separate. See reset-password-form.tsx, which *does* want the shared
// client precisely because it needs the opposite behaviour.
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

interface Props {
  locale: string;
}

export function ForgotPassword({ locale }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    // Send the user back to our own reset page rather than the project's
    // Site URL, so the recovery link lands somewhere that can actually
    // set a new password.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    });

    if (error) {
      setStatus("error");
      setErrorMsg(
        locale === "ar"
          ? "تعذّر إرسال الرابط — تأكد من البريد أو حاول لاحقاً (قد يكون حد الإرسال قد استُنفد)"
          : "Could not send the link — check the email, or try later (send limit may be reached)",
      );
      return;
    }

    setStatus("sent");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-center text-xs font-semibold text-[var(--color-slate)] underline-offset-2 hover:text-[var(--color-mint)] hover:underline"
      >
        {locale === "ar" ? "نسيت كلمة المرور؟" : "Forgot your password?"}
      </button>
    );
  }

  if (status === "sent") {
    return (
      <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {locale === "ar"
          ? "تم إرسال رابط إعادة التعيين — تفقّد بريدك."
          : "Reset link sent — check your inbox."}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 border-t border-[var(--color-iron)] pt-4">
      <label
        htmlFor="reset-email"
        className="mb-1 block text-sm font-semibold text-[var(--color-ceramic)]"
      >
        {locale === "ar" ? "أرسل رابط إعادة التعيين إلى" : "Send a reset link to"}
      </label>
      <div className="flex gap-2">
        <input
          id="reset-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={locale === "ar" ? "بريدك الإلكتروني" : "your email"}
          className="min-w-0 flex-1 rounded-xl border border-[var(--color-iron)] px-3 py-2 text-sm text-[var(--color-ceramic)] focus:border-[var(--color-mint)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-xl bg-[var(--color-ceramic)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {status === "loading"
            ? (locale === "ar" ? "..." : "...")
            : (locale === "ar" ? "إرسال" : "Send")}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-600">{errorMsg}</p>
      )}
    </form>
  );
}
