# COWORK.md — كتابة بيانات المنتجات مباشرة على Supabase

> تعليمات موجّهة للـagent اللي بيولّد بيانات المنتجات ويرفعها على Supabase مباشرة
> (بدل بايبلاين n8n القديم اللي اتوقف).
>
> **آخر تحديث:** 2026-07-25 · **مشروع Supabase:** `xeylyyfmcucphggqwxdv`

---

## ⚡ TL;DR — أهم حاجة

الكتابة المباشرة على جداول Supabase **مش بتبلّغ Next.js بأي حاجة**. القراءات على المتجر
كلها متخزّنة بـ`"use cache"` + `cacheLife("hours")`، يعني المنتج اللي ترفعه ممكن
**ما يظهرش لحد ساعة**.

**بعد ما تخلّص أي رفع، لازم تنده على:**

```bash
curl -X POST "$SITE_URL/api/revalidate" \
  -H "x-webhook-secret: $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

من غير النداء ده، شغلك مش هيبان على المتجر. **دي مش خطوة اختيارية.**

---

## 1. Revalidation — العقد الكامل

`POST /api/revalidate` — الملف: `app/api/revalidate/route.ts`

| العنصر | القيمة |
|---|---|
| Header إجباري | `x-webhook-secret: <REVALIDATE_SECRET>` |
| لو الـsecret غلط | `401 {"ok":false,"error":"Unauthorized"}` |
| نجاح | `200 {"ok":true,"target":"...","now":<ts>}` |

### الأجسام المقبولة

```jsonc
{}                                          // إلغاء شامل — استخدمه بعد رفع بالجملة
{ "type": "product",  "slug": "<slug>" }    // منتج واحد
{ "type": "category", "slug": "<slug>" }    // قسم واحد
```

**نصيحة:** لو رفعت منتج واحد، ابعت `type: "product"` بالـslug — أدق وأسرع.
لو رفعت دفعة كبيرة، نداء واحد بـ`{}` في الآخر أحسن من عشرات النداءات.

> ⚙️ الـendpoint ده بيستخدم `{ expire: 0 }` (مش profile زي `"hours"`) — يعني الإلغاء
> **فوري**، وأول زائر بعده بيشوف الجديد. اتعدّل في 2026-07-25؛ قبل كده كان بيعلّم
> الكاش "stale" بس والزائر الجاي كان لسه بياخد القديم.

---

## 2. عقد البيانات — الجداول

### `products`

| العمود | النوع | ملاحظات |
|---|---|---|
| `id` | uuid | default `gen_random_uuid()` |
| `name` | text | **NOT NULL** — النص الاحتياطي لو مفيش ترجمة |
| `slug` | text | nullable في الـDB **لكن إلزامي عملياً** (شوف قسم 3) |
| `description` | text | nullable — احتياطي |
| `brand` | text | nullable |
| `category_id` | uuid | nullable → `categories.id` |
| `is_active` | boolean | NOT NULL, default `true` |
| `images` | jsonb | NOT NULL, default `[]` — مصفوفة روابط |
| `specs` | jsonb | NOT NULL, default `{}` — احتياطي، `{"مفتاح":"قيمة"}` |
| `ai_metadata` | jsonb | NOT NULL, default `{}` |

### `variants` — **بدونها المنتج مش هيظهر في القوائم**

| العمود | النوع | ملاحظات |
|---|---|---|
| `product_id` | uuid | NOT NULL → `products.id` (ON DELETE CASCADE) |
| `sku_code` | text | NOT NULL |
| `price` | numeric | NOT NULL |
| `sale_price` | numeric | nullable |
| `discount_badge` | text | nullable |
| `stock_quantity` | integer | NOT NULL, default `0` |
| `condition` | enum | default `'Good'` — **`Premium` \| `Excellent` \| `Good` \| `Fair`** (حسّاس لحالة الأحرف) |
| `attributes` | jsonb | NOT NULL, default `{}` |

### `product_translations`

| العمود | النوع | ملاحظات |
|---|---|---|
| `product_id` | uuid | NOT NULL → `products.id` (ON DELETE CASCADE) |
| `lang` | text | NOT NULL — **`'ar'` أو `'en'` بس** (فيه CHECK constraint) |
| `title` | text | nullable |
| `description` | text | nullable |
| `specs` | jsonb | default `{}` |
| `features` | jsonb | default `[]` — ⚠️ **المتجر مش بيقراه حالياً** |
| `ai_metadata` | jsonb | default `{}` |

**قيد مهم:** `UNIQUE (product_id, lang)` — استخدم upsert بـ`onConflict: "product_id,lang"`
بدل insert، وإلا هتاخد خطأ عند إعادة الرفع.

---

## 3. ⚠️ الحاجات اللي بتخلّي المنتج مختفي

دي أكتر أسباب "رفعت المنتج ومش لاقيه". كلها من `lib/queries/products.ts`:

| القاعدة | لو اتكسرت |
|---|---|
| `is_active = true` | المنتج مش هيظهر **خالص** — لا في صفحته ولا في القوائم |
| `slug IS NOT NULL` | مش هيظهر في القوائم ولا الأقسام |
| **`variants` فيه صف واحد على الأقل** | مش هيظهر في القوائم ولا الأقسام (صفحته المباشرة تشتغل) |
| `category_id` صحيح | مش هيظهر تحت أي قسم |

> 🔴 **أشهر غلطة:** ترفع صف في `products` وتنسى `variants`. المنتج بيبقى موجود في
> قاعدة البيانات، وصفحته `/en/products/<slug>` بتفتح عادي — بس **مش بيبان في أي
> قائمة أو قسم**، لأن الكود بيفلتر أي منتج مالوش variants.

**الـslug:** حروف صغيرة وأرقام وشرطات بس — `^[a-z0-9-]+$`.

---

## 4. إزاي المتجر بيختار اللغة

`getProductBySlug(slug, locale)` بيجيب صف `products` الأساسي، وبعدين بيجيب صف
`product_translations` بالـ`lang` المطابق للـlocale، ويركّبه فوقه:

| الحقل المعروض | المصدر | لو فاضي بيرجع لـ |
|---|---|---|
| الاسم | `product_translations.title` | `products.name` |
| الوصف | `product_translations.description` | `products.description` |
| المواصفات | `product_translations.specs` | `products.specs` |

**قاعدة "الفاضي":** `NULL` و `""` و **المسافات لوحدها** — كلهم بيتعاملوا كـ"مش مترجم"
ويرجّعوا للعمود الأساسي. للمواصفات: `{}` بيرجع للأساسي، وأي مفتاح واحد بيكفي إنها تُستخدم.

> ✅ يعني تقدر ترفع `""` من غير ما تكسر حاجة — بس **الأنضف ترفع `NULL`**.
> (اتظبط في 2026-07-25؛ قبل كده `""` في الوصف كان بيطلع فاضي على الصفحة.)

**الأفضل دايماً:** املا `products.name`/`description`/`specs` بالعربي (اللغة الأساسية
للسوق)، وبعدين ضيف صف `en` في `product_translations`. كده لو الإنجليزي ناقص،
الزائر بيشوف العربي بدل صفحة فاضية.

---

## 5. الصلاحيات (RLS)

RLS مفعّل على `product_translations` بسياستين:

| السياسة | الأدوار | الصلاحية |
|---|---|---|
| `product_translations_public_select` | anon, authenticated | SELECT (`USING true`) |
| `product_translations_admin_all` | authenticated | ALL — بشرط `is_admin()` |

**يعني:** مفتاح `anon` بيقرا بس. أي **كتابة** محتاجة `service_role` key أو جلسة
مستخدم دوره `admin` في جدول `profiles`.

---

## 6. ممنوعات

| ❌ ما تعملش | ✅ اعمل |
|---|---|
| ترفع وتسيب من غير `/api/revalidate` | نداء واحد على الأقل بعد كل دفعة |
| `INSERT` في `product_translations` | `UPSERT` بـ`onConflict: "product_id,lang"` |
| `lang` بأي قيمة تانية (`EN`, `arabic`, `ar-EG`) | `'ar'` أو `'en'` بس |
| `condition` بحروف صغيرة (`good`) | `'Good'` بالضبط |
| منتج من غير variants | variant واحد على الأقل |
| تحط `REVALIDATE_SECRET` في كود متتبّع في git | من متغيرات البيئة |

---

## 7. تسلسل الرفع الموصى به

```
1. upsert  products          → خُد الـid الراجع
2. upsert  variants          → لازم صف واحد على الأقل
3. upsert  product_translations (ar)  ← عادةً الأساسي
4. upsert  product_translations (en)
5. POST    /api/revalidate            ← لا تتخطاها
6. تأكيد:  افتح /ar/products/<slug> و /en/products/<slug>
```

---

## ملاحظات على لوحة التحكم

لو حد عدّل نفس المنتج من `/dashboard/catalog/edit` بعد رفعك:

- الحفظ من اللوحة **بيلغي الكاش لوحده** (مش محتاج نداء يدوي).
- الحفظ بيعامل الترجمات كـ**مجموعة كاملة**: أي لغة كل خاناتها فاضية في الفورم
  **بيتمسح صفّها من قاعدة البيانات**. فلو رفعت ترجمة إنجليزي ومحصلش تظهر في
  الفورم لأي سبب، الحفظ ممكن يشيلها.
- الحفظ بيستبدل **كل** الـvariants (مسح ثم إضافة) — مش دمج.

---

## الخطة البديلة (n8n — متوقّفة الاستخدام)

لو احتجت ترجع لبايبلاين n8n يوماً ما:

| المورد | القيمة |
|---|---|
| TEKDOM 1 — Intake & Enrichment | `UfpZ0BYZ05ua4S1A` |
| TEKDOM 2 — DB Writer | `Z4iopTC6qSTmtlSh` |
| ملف قرارات المعمارية | `D:/level X/.claudecode/skills/workflow_optimizer_agent.xml` |

⚠️ الـworkflow القديم `Q1LKEh5okGIThDbh` **مؤرشف** — اتبدل بالاتنين فوق في 2026-07-12.
أي توثيق قديم بيشاور عليه بقى غلط.

⚠️ n8n كمان بيكتب على Supabase مباشرة، يعني **نفس شرط `POST /api/revalidate`** ينطبق عليه.

