import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  const supabase = await createSupabaseServerClient();

  // تحقق من الجلسة — TODO: غيّر `/${locale}` لـ `/${locale}/login` لما تتبني صفحة الـ login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}`);

  // تحقق من الدور — غير admin يرجع للرئيسية
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect(`/${locale}`);

  return <>{children}</>;
}
