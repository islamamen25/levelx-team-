import { CheckoutForm } from "@/components/checkout/checkout-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Checkout — LevelX",
};

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-white pt-[6.5rem]">
      <CheckoutForm locale={locale} />
    </div>
  );
}
