"use client";

import { useRouter } from "@/i18n/navigation";
import { ProductForm } from "@/components/admin/product-form";
import type { DbProduct, DbVariant, DbTranslation } from "@/lib/supabase";

interface Props {
  locale: string;
  product?: DbProduct;
  variants?: DbVariant[];
  translations?: DbTranslation[];
  categories: { id: string; name: string }[];
}

/**
 * Page-level wrapper around ProductForm: leaving or saving returns to the
 * catalog list instead of closing a dialog.
 */
export function ProductFormPage({ locale, product, variants, translations, categories }: Props) {
  const router = useRouter();

  const back = () => {
    router.push({ pathname: "/dashboard/catalog" }, { locale: locale as "en" | "ar" });
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--color-obsidian)] pt-[6.5rem]">
      <div className="container-px mx-auto py-8 md:py-12">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/*
            key={product?.id ?? "new"} forces a full remount whenever the
            edited product changes. Without it, Next.js keeps this client
            component instance mounted across /catalog/edit?id=X navigations
            (same route, different searchParams), so the form's local state
            — initialized once via useState(() => initForm(...)) — never
            re-runs and keeps showing the PREVIOUS product's data in every
            field except the header (which reads the `product` prop live).
          */}
          <ProductForm
            key={product?.id ?? "new"}
            product={product}
            variants={variants}
            translations={translations}
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
