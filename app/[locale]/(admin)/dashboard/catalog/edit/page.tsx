import { connection } from "next/server";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllCategoriesAdmin } from "@/lib/queries/categories";
import { ProductFormPage } from "@/components/admin/product-form-page";

// A static segment with ?id= rather than /[id]: a dynamic segment would need
// a prerendered fallback shell, which the (admin) layout's session check
// (cookies) cannot produce under cacheComponents.
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "تعديل منتج — LevelX" : "Edit product — LevelX",
  };
}

export default async function EditProductPage({ params, searchParams }: Props) {
  await connection();
  const { locale } = await params;
  const { id } = await searchParams;

  if (!id) notFound();

  const supabase = await createSupabaseServerClient();

  const [{ data: product }, variantsRes, translationsRes, dbCategories] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("variants").select("*").eq("product_id", id).order("price", { ascending: true }),
    supabase.from("product_translations").select("*").eq("product_id", id),
    getAllCategoriesAdmin(),
  ]);

  if (!product) notFound();

  // Saving this form sends variants and translations as a COMPLETE set — the
  // API replaces variants wholesale and deletes any language not in the
  // payload. So a failed read here must not fall through to an empty form:
  // the admin would see blank fields and the first save would wipe live rows.
  // Fail loudly instead and let the error boundary handle it.
  if (variantsRes.error) throw new Error(`Failed to load variants: ${variantsRes.error.message}`);
  if (translationsRes.error) throw new Error(`Failed to load translations: ${translationsRes.error.message}`);

  const variants = variantsRes.data;
  const translations = translationsRes.data;

  return (
    <ProductFormPage
      locale={locale}
      product={product}
      variants={variants ?? []}
      translations={translations ?? []}
      categories={dbCategories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
