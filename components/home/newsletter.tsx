"use client";

import { useState } from "react";
import { Mail, ChevronDown } from "lucide-react";

interface NewsletterProps {
  locale: string;
}

export function Newsletter({ locale }: NewsletterProps) {
  const [expanded, setExpanded] = useState(false);
  const isAr = locale === "ar";

  return (
    <section className="bg-[#F5F5F7] py-10 md:py-14">
      <div className="container-px mx-auto">
        <div className="overflow-hidden rounded-3xl bg-[var(--color-mint-soft)] px-8 py-12 text-center md:px-12 md:py-16">
          {/* Headline */}
          <h2
            className="text-ceramic"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            {isAr ? (
              <>احصل على <span className="text-[var(--color-mint)]">خصم £15</span> على طلبك الأول.</>
            ) : (
              <>Get <span className="text-[var(--color-mint)]">£15 off</span> your first order.</>
            )}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate">
            {isAr
              ? "على الطلبات بقيمة £250 أو أكثر، عند الاشتراك في رسائلنا."
              : "On orders of £250 or more, when you sign up for emails."}
          </p>

          {/* Email form */}
          <form className="mx-auto mt-8 flex max-w-lg gap-2">
            <div className="relative flex-1">
              <input
                type="email"
                placeholder={isAr ? "البريد الإلكتروني" : "Email"}
                className="w-full rounded-xl border border-[var(--color-iron)] bg-white py-3.5 pe-12 ps-5 text-sm text-ceramic focus:border-[var(--color-mint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-mint)]/15"
              />
              <Mail
                className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-ceramic px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-ceramic/90"
            >
              {isAr ? "اشترك" : "Sign up"}
            </button>
          </form>

          {/* Learn more toggle */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-5 inline-flex items-center gap-1 text-sm text-slate transition-colors hover:text-ceramic"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
            {isAr ? "اعرف المزيد" : "Learn more"}
          </button>
          {expanded && (
            <p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-slate">
              {isAr
                ? "اشترك في رسائلنا واحصل على خصم £15 على أول طلب بقيمة £250 أو أكثر. يُطبق تلقائياً عند الدفع. يمكنك إلغاء الاشتراك في أي وقت."
                : "Subscribe to our emails and get £15 off your first order of £250 or more. Applied automatically at checkout. You can unsubscribe at any time."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
