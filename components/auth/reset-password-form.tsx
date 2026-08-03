"use client";

import { useState } from "react";
// The shared browser singleton, which is created with default auth options
// (persistSession + detectSessionInUrl). That is exactly what this form needs:
// the client must pick up the recovery token Supabase Auth put in the URL after
// the user clicked the "reset password" email link, and turn it into a temporary
// session we can then call updateUser() against.
import { supabase } from "@/lib/supabase";

interface Props {
  locale: string;
}

export function ResetPasswordForm({ locale }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      setStatus("error");
      setErrorMsg(locale === "ar" ? "كلمة المرور قصيرة جداً (6 أحرف على الأقل)" : "Password is too short (min 6 characters)");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setErrorMsg(locale === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }

    setStatus("loading");
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setErrorMsg(
        locale === "ar"
          ? "تعذّر تحديث كلمة المرور — الرابط قد يكون منتهي الصلاحية، اطلب رابطاً جديداً"
          : "Could not update password — the link may have expired, request a new one"
      );
      return;
    }

    setStatus("done");
    setTimeout(() => {
      window.location.href = `/${locale}/dashboard`;
    }, 1200);
  }

  if (status === "done") {
    return (
      <p className="text-sm font-semibold text-emerald-600">
        {locale === "ar" ? "تم تحديث كلمة المرور، جارٍ تحويلك..." : "Password updated, redirecting..."}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {status === "error" && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</div>
      )}

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold text-[var(--color-ceramic)]">
          {locale === "ar" ? "كلمة المرور الجديدة" : "New password"}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-iron)] px-4 py-2.5 text-sm text-[var(--color-ceramic)] focus:border-[var(--color-mint)] focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="mb-1 block text-sm font-semibold text-[var(--color-ceramic)]">
          {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm password"}
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-iron)] px-4 py-2.5 text-sm text-[var(--color-ceramic)] focus:border-[var(--color-mint)] focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 w-full rounded-full bg-[var(--color-mint)] py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--color-mint-hover)] disabled:opacity-50"
      >
        {status === "loading"
          ? (locale === "ar" ? "جارٍ الحفظ..." : "Saving...")
          : (locale === "ar" ? "تحديث كلمة المرور" : "Update password")}
      </button>
    </form>
  );
}
