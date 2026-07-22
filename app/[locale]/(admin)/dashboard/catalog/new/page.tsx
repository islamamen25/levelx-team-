import { connection } from "next/server";
import { getAllCategoriesAdmin } from "@/lib/queries/categories";
import { ProductFormPage } from "@/components/admin/product-form-page";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "إضافة منتج — LevelX" : "Add product — LevelX",
  };
}

export default async function NewProductPage({ params }: Props) {
  await connection();
  const { locale } = await params;

  const dbCategories = await getAllCategoriesAdmin();
  const categories = dbCategories.map((c) => ({ id: c.id, name: c.name }));

  return <ProductFormPage locale={locale} categories={categories} />;
}
