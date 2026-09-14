"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import { signOutAction } from "@/lib/auth-actions";

interface Props {
  email: string;
  locale: string;
}

/**
 * Small popover for the signed-in state — just email + sign out. There is no
 * `/account` page yet (orders has no `user_id` to key one off — see the
 * customer-auth-drawer plan), so this deliberately doesn't link anywhere.
 */
export function AccountMenu({ email, locale }: Props) {
  const t = useTranslations("auth");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("myAccount")}
        aria-expanded={open}
        title={t("myAccount")}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-mint)]/10 text-[var(--color-mint)] transition-colors hover:bg-[var(--color-mint)]/20"
      >
        <User className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>

      {open && (
        <div
          dir="auto"
          className="absolute end-0 top-11 z-50 w-64 rounded-xl border border-[var(--color-iron)] bg-white p-3 shadow-lg"
        >
          <p className="truncate px-2 py-1 text-xs text-[var(--color-slate)]">
            {t("signedInAs", { email })}
          </p>
          <form action={signOutAction.bind(null, locale)}>
            <button
              type="submit"
              className="mt-1 w-full rounded-lg px-2 py-2 text-start text-sm font-semibold text-[var(--color-ceramic)] hover:bg-[var(--color-graphite)]"
            >
              {t("signOut")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
