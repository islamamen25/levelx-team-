import { cacheLife, cacheTag } from "next/cache";
import { createSupabasePublicClient, createSupabaseServerClient } from "@/lib/supabase/server";

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
};

export type CategoryFlat = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  depth: number;
  path: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  is_visible: boolean;
};

// شجرة الأقسام المتداخلة — مُخزَّنة لمدة ساعة، قابلة للإبطال بـ tag
export async function getCategoryTree(): Promise<CategoryNode[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_category_tree");
  if (error) throw new Error(`get_category_tree: ${error.message}`);
  return (data ?? []) as CategoryNode[];
}

// قائمة مسطّحة مع depth + path — للـ Breadcrumbs وgenerateStaticParams
export async function getCategoryFlat(): Promise<CategoryFlat[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_category_flat");
  if (error) throw new Error(`get_category_flat: ${error.message}`);
  return (data ?? []) as CategoryFlat[];
}

// قسم واحد بالـ slug
export async function getCategoryBySlug(slug: string): Promise<CategoryFlat | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories", `category:${slug}`);

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .eq("slug", slug)
    .eq("is_visible", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { ...data, depth: 0, path: slug } as CategoryFlat;
}

// كل الأقسام (بما فيها المخفية) — للـ Admin Dashboard
export async function getAllCategoriesAdmin(): Promise<CategoryRow[]> {
  // لا cache — المدير يحتاج أحدث نسخة دائماً
  // نستخدم server client لأن RLS يُخفي is_visible=false عن anon
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, is_visible")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRow[];
}
