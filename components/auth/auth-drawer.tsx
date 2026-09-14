"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { AuthForms } from "@/components/auth/auth-forms";

interface Props {
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Path to return to once signed in — the page the drawer was opened from. */
  next: string;
  defaultTab?: "signin" | "signup";
}

/**
 * The slide-over auth sheet, opened from the Navbar's user icon. Reuses the
 * same base-ui Sheet primitive as the mobile nav menu (components/ui/sheet.tsx)
 * — it already handles Escape, backdrop click, and enter/exit transitions, so
 * none of that needed reimplementing here.
 */
export function AuthDrawer({ locale, open, onOpenChange, next, defaultTab }: Props) {
  const tc = useTranslations("common");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        className="w-[min(400px,90vw)] border-[var(--color-iron)] bg-white"
      >
        <div className="flex items-center justify-end border-b border-[var(--color-iron)] px-6 py-5">
          <SheetClose
            aria-label={tc("close")}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ceramic hover:bg-[var(--color-graphite)]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </SheetClose>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          <AuthForms locale={locale} next={next} defaultTab={defaultTab} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
