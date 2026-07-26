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
  in_carousel: boolean;
  sort_order: number;
  icon: string | null;
  color_key: string | null;
  display_name: string | null;
};

/** A category as presented in the home page carousel. */
export type CarouselCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color_key: string | null;
};

/** الاسم العربي عمود منفصل (name_ar) — فاضي/مسافات يُعامَل "غير مترجم"،
 * نفس قاعدة "الفاضي" المستخدمة في product_translations (راجع COWORK.md). */
function localizedName(name: string, nameAr: string | null | undefined, locale: string): string {
  if (locale !== "ar") return name;
  const trimmed = nameAr?.trim();
  return trimmed || name;
}

// Categories the admin picked for the home page carousel, in their order.
export async function getCarouselCategories(locale: string): Promise<CarouselCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, name_ar, slug, icon, color_key, display_name")
    .eq("is_visible", true)
    .eq("in_carousel", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`getCarouselCategories: ${error.message}`);

  return (data ?? []).map((c) => ({
    id: c.id,
    // display_name lets the admin shorten a long category name for the strip
    name: c.display_name?.trim() || localizedName(c.name, c.name_ar, locale),
    slug: c.slug,
    icon: c.icon,
    color_key: c.color_key,
  }));
}

// شجرة الأقسام المتداخلة — مُخزَّنة لمدة ساعة، قابلة للإبطال بـ tag
export async function getCategoryTree(locale: string): Promise<CategoryNode[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_category_tree", { _lang: locale });
  if (error) throw new Error(`get_category_tree: ${error.message}`);
  return (data ?? []) as CategoryNode[];
}

// قائمة مسطّحة مع depth + path — للـ Breadcrumbs وgenerateStaticParams
export async function getCategoryFlat(locale: string): Promise<CategoryFlat[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_category_flat", { _lang: locale });
  if (error) throw new Error(`get_category_flat: ${error.message}`);
  return (data ?? []) as CategoryFlat[];
}

// قسم واحد بالـ slug
export async function getCategoryBySlug(slug: string, locale: string): Promise<CategoryFlat | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories", `category:${slug}`);

  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, name_ar, slug, parent_id")
    .eq("slug", slug)
    .eq("is_visible", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    name: localizedName(data.name, data.name_ar, locale),
    slug: data.slug,
    parent_id: data.parent_id,
    depth: 0,
    path: slug,
  };
}

// كل الأقسام (بما فيها المخفية) — للـ Admin Dashboard
export async function getAllCategoriesAdmin(): Promise<CategoryRow[]> {
  // لا cache — المدير يحتاج أحدث نسخة دائماً
  // نستخدم server client لأن RLS يُخفي is_visible=false عن anon
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, is_visible, in_carousel, sort_order, icon, color_key, display_name")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRow[];
}
