import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getStoreConfig } from "@/lib/store-config";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Checkout — LevelX",
};

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  const { delivery } = await getStoreConfig();

  return (
    <div className="min-h-screen bg-white pt-[6.5rem]">
      <CheckoutForm locale={locale} delivery={delivery} />
    </div>
  );
}
