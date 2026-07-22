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

  const [{ data: product }, { data: variants }, dbCategories] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("variants").select("*").eq("product_id", id).order("price", { ascending: true }),
    getAllCategoriesAdmin(),
  ]);

  if (!product) notFound();

  return (
    <ProductFormPage
      locale={locale}
      product={product}
      variants={variants ?? []}
      categories={dbCategories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
