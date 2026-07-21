import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "إعادة تعيين كلمة المرور — LevelX" : "Reset password — LevelX",
  };
}

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white pt-24 pb-12">
      <div className="w-full max-w-sm px-6">
        <h1 className="mb-1 text-2xl font-extrabold text-[var(--color-ceramic)]">
          {locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset password"}
        </h1>
        <p className="mb-6 text-sm text-[var(--color-slate)]">
          {locale === "ar"
            ? "اختر كلمة مرور جديدة لحسابك"
            : "Choose a new password for your account"}
        </p>
        <ResetPasswordForm locale={locale} />
      </div>
    </div>
  );
}
