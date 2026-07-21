# TEKDOM — Amazon → Supabase Auto Data Entry (n8n)

أتمتة إدخال المنتجات: **Excel (اسم + سيريال) → Apify scraping من amazon.eg → معالجة صور → Supabase**.

ملف الـ workflow: [`amazon-data-entry.workflow.json`](./amazon-data-entry.workflow.json)

---

## التدفّق (Flow)

```
Upload Excel (Form)
  → Parse Excel (xlsx → rows)
  → Normalize Rows (name + serial)
  → Loop Products (واحد واحد)
       → Build Search URL  (https://www.amazon.eg/s?k=<name>)
       → Apify: Scrape Amazon  (junglee/Amazon-crawler, أول نتيجة)
       → Map Amazon Product  (title, brand, description, specs, images, asin)
       → Has Images?
            true  → Split Images → Download → Resize(1000px/JPEG) → Upload to Storage → Collect URLs ─┐
            false ─────────────────────────────────────────────────────────────────────────────────┤
       → Insert Product   (products,    return=representation → id)
       → Insert Variant   (variants,    product_id=id, price=0, condition='Good')
       → Insert Serial    (serial_items, variant_id=id, serial_number)
       → (loop) → Loop Products
```

---

## الإعداد قبل التشغيل

### 1) الاستيراد
n8n → **Workflows → Import from File** → اختَر `amazon-data-entry.workflow.json`.

> ملاحظة: الـ n8n instance (`n8n.srv1344298.hstgr.cloud`) رجّعت 404 وقت البناء — لو الـ API اتفعّل نقدر نعمل push/تشغيل مباشرة بدل الاستيراد اليدوي.

### 2) الـ Credentials (لازم تتظبط بعد الاستيراد)

| Credential | النوع | القيمة |
|---|---|---|
| **Apify Bearer Token** | Header Auth | Name: `Authorization` · Value: `Bearer apify_api_XXXX` |
| **Supabase Service Role** | Supabase API | Host: `https://xeylyyfmcucphggqwxdv.supabase.co` · Service Role Key: `eyJ...` (من Supabase → Settings → API) |

تُستخدم نفس Supabase credential في 4 نودات (Storage + 3 inserts). الـ **service_role** بيتخطّى الـ RLS، فالإدخال الآلي بيشتغل من غير تسجيل دخول.

### 3) Storage bucket
اتأكد إن bucket باسم **`product-images`** موجود و **public**:
```sql
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict do nothing;
```

### 4) شكل ملف الـ Excel
عمودان (الأسماء مرنة — بيدعم عربي/إنجليزي):

| name (اسم المنتج) | serial (سيريال) |
|---|---|
| iPhone 14 Pro 256GB | SN-ABC-001 |
| Samsung Galaxy S23 | SN-XYZ-777 |

---

## ملاحظات مهمة

- **السعر = 0** و **condition = 'Good'** افتراضيًا (حسب اختيارك). عدّلهم يدويًا من الأدمن بعد الإدخال، أو غيّر القيم في نود `Insert Variant`.
- **`is_serialized = true`** لكل منتج (لأن كل صف معاه سيريال).
- **`sku_code` = ASIN** و **`serial_number`** كلاهما `unique` في الـ DB → إعادة تشغيل نفس الصف هتفشل بـ 409 (متوقّع). لو عايز re-run آمن نضيف upsert/dedup.
- **اللي مالوش نتيجة على أمازون**: حاليًا بيكمل بصف فاضٍ جزئيًا. ممكن نضيف نود فلترة (skip لو مفيش `asin`).
- معالجة الصور: تصغير لأقصى 1000×1000 + تحويل JPEG جودة 82، ورفع لـ `product-images/<ASIN>/<index>.jpg`.

## أفكار تحسين (اختياري)

- **Dedup** قبل الإدخال: GET `/rest/v1/products?slug=eq.<slug>` وتخطّي الموجود.
- **Error workflow** + إعادة محاولة على نودات الـ HTTP.
- **Meilisearch reseed** في الآخر (`scripts/seed-meilisearch.ts`) عشان المنتجات الجديدة تظهر في البحث.
- ربط **category_id** تلقائيًا من تصنيف أمازون.
