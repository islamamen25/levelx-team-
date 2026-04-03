import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("common");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold tracking-tight">{t("brand")}</h1>
      <p className="text-zinc-500">Phase 1 foundation active.</p>
    </main>
  );
}
