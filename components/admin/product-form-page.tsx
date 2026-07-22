"use client";

import { useRouter } from "@/i18n/navigation";
import { ProductForm } from "@/components/admin/product-form";
import type { DbProduct, DbVariant } from "@/lib/supabase";

interface Props {
  locale: string;
  product?: DbProduct;
  variants?: DbVariant[];
  categories: { id: string; name: string }[];
}

/**
 * Page-level wrapper around ProductForm: leaving or saving returns to the
 * catalog list instead of closing a dialog.
 */
export function ProductFormPage({ locale, product, variants, categories }: Props) {
  const router = useRouter();

  const back = () => {
    router.push({ pathname: "/dashboard/catalog" }, { locale: locale as "en" | "ar" });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--color-obsidian)] pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-12">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <ProductForm
            product={product}
            variants={variants}
            categories={categories}
            onClose={back}
            onSaved={back}
            fullPage
          />
        </div>
      </div>
    </div>
  );
}
