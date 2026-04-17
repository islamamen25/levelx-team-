import { getTranslations } from "next-intl/server";
import { ShieldCheck, RotateCcw, Truck, BadgeCheck, type LucideIcon } from "lucide-react";

const ITEMS: { key: "warranty" | "returns" | "delivery" | "verified"; Icon: LucideIcon }[] = [
  { key: "warranty", Icon: ShieldCheck },
  { key: "returns",  Icon: RotateCcw   },
  { key: "delivery", Icon: Truck       },
  { key: "verified", Icon: BadgeCheck  },
];

interface TrustBannerProps {
  locale: string;
}

export async function TrustBanner({ locale }: TrustBannerProps) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section className="bg-[#F5F5F7] py-14 md:py-16" aria-label="Trust">
      <div className="container-px mx-auto">
        <h2
          className="mb-8 text-center text-ceramic"
          style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.015em" }}
        >
          {t("trustTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ key, Icon }) => (
            <div
              key={key}
              className="flex items-start gap-4 rounded-2xl border border-[var(--color-iron)] bg-white p-5 shadow-sm"
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-mint-soft)] text-[var(--color-mint)]">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-bold text-ceramic">{t(`trust.${key}`)}</p>
                <p className="mt-0.5 text-xs text-slate">{t(`trust.${key}Sub`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
