# TEKDOM — Amazon → Supabase Auto Data Entry (n8n)

أتمتة إدخال المنتجات: **Excel على Google Drive → إثراء البيانات → مراجعة على تيليجرام → Supabase**.

> **الحالة:** 🟢 يعمل — الاثنان مُفعّلان على `https://n8n.islamai.shop`.
> **آخر تحقّق:** 2026-07-22 عبر n8n API.

---

## الـ Workflows

الـ pipeline مقسوم إلى اثنين (كان workflow واحداً بـ 54 عقدة وتم تقسيمه):

| # | الاسم | ID | العقد | الدور |
|---|---|---|---|---|
| 1 | **TEKDOM 1 - Intake & Enrichment** | `UfpZ0BYZ05ua4S1A` | 41 | يلتقط الملفات، يثري البيانات، يرسل للمراجعة |
| 2 | **TEKDOM 2 - DB Writer** | `Z4iopTC6qSTmtlSh` | 20 | يكتب في Supabase فقط |
| — | ~~TEKDOM القديم (monolith)~~ | `Q1LKEh5okGIThDbh` | 54 | **مؤرشف** — لا تستخدمه |

TEKDOM 1 يستدعي TEKDOM 2 عبر عقدة `Execute Workflow`، فالكتابة في قاعدة البيانات معزولة ويمكن اختبارها وحدها.

> ⚠️ **لا يوجد ملف workflow محلي بعد الآن.** المصدر الوحيد للحقيقة هو الـ instance نفسه.
> النسخة القديمة (`amazon-data-entry.workflow.json`) حُذفت لأنها كانت متجاوَزة تماماً واستيرادها كان سينشئ تكراراً.

---

## TEKDOM 1 — التدفّق

```
Every Minute (Schedule)
  → List Drive Folder → Filter XLSX Files
  → Lock File (rename → DONE_)        ← يمنع المعالجة المزدوجة
  → Download Excel → Parse Excel → Normalize Rows
  → Loop Products ──────────────────────────────► Move to Processed Folder → All Done
       │
       ├─ Barcode Lookup (UPCitemdb) → Map Amazon Product
       ├─ Google Image Search → Merge Google Images
       ├─ Has Images?
       │     نعم → Split → Download → Resize → Upload to Supabase Storage → Collect URLs
       │
       ├─ Prepare Telegram Message → Send Images Album → Send Telegram Review
       └─ Check Approval
             ✅ موافق  → Build DB Payload → Call DB Writer (TEKDOM 2)
             ❌ مرفوض → Lookup by Barcode → Has Barcode Data?
                          نعم → Prepare Second Review ─┐
                          لا  → Google Search → Extract Official URL
                                 → Scrape Official Site → Map Official Data ─┤
                                                                              ▼
                                              Send Second Review → Check Second Approval
                                                 ✅ → Build DB Payload 2 → Call DB Writer (2nd)
                                                 ❌ → رجوع إلى Loop Products (تخطّي)
```

**فكرة التصميم:** لا شيء يدخل قاعدة البيانات قبل موافقتك على تيليجرام. لو رُفض المنتج، النظام يحاول إثراءه من مصدر آخر (باركود ← بحث Google ← الموقع الرسمي) ويعرضه عليك ثانيةً.

---

## TEKDOM 2 — التدفّق

```
When Called (Execute Workflow Trigger)
  → Product Data → Insert Product → Get Existing Product
  → Link Product Categories
  → Insert Translation AR
  → Check ASIN Valid
        صالح → Apify: Scrape Amazon EN → Map Amazon Product EN → Insert Translation EN
  → Delete Old Product Images → Prepare Product Images → Insert Product Images
  → Prepare Variant Data → Insert Variant → Get Existing Variant
  → Has Serials?
        نعم → Prepare Serial Data → Insert Serial Item
  → Done
```

**نموذج ثنائي اللغة:** الوصف العربي من `amazon.eg`، والإنجليزي يُجلب بالـ ASIN من `amazon.com` — كلاهما في جدول `product_translations`.

---

## الـ Credentials المطلوبة

| Credential | النوع | يُستخدم في |
|---|---|---|
| **Google Drive** | OAuth2 | List / Lock / Download (TEKDOM 1) |
| **Telegram Bot** | Telegram API | المراجعتان (TEKDOM 1) |
| **Apify** | Header Auth — `Authorization: Bearer apify_api_XXXX` | Scrape Amazon EN (TEKDOM 2) |
| **Supabase service_role** | Header Auth | رفع الصور + كل عمليات الإدخال |

الـ **service_role** يتخطّى RLS، فالإدخال الآلي يعمل بلا تسجيل دخول. **لا تضع هذا المفتاح في أي كود frontend.**

---

## المتطلبات

### Storage bucket
```sql
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict do nothing;
```

### مجلدا Google Drive
- مجلد الإدخال (يراقبه الـ Schedule كل دقيقة)
- **"TEKDOM - Processed"** — تُنقل إليه الملفات بعد المعالجة (لا تُحذف أبداً)

### شكل ملف Excel
| name (اسم المنتج) | serial (سيريال) |
|---|---|
| iPhone 14 Pro 256GB | SN-ABC-001 |

الأعمدة مرنة وتدعم العربية والإنجليزية.

---

## ملاحظات مهمة

- **السعر = 0** و **condition = 'Good'** افتراضياً — عدّلهما من لوحة التحكم (`/dashboard/catalog`) بعد الإدخال.
- **`sku_code` (ASIN) و `serial_number`** كلاهما `unique` → إعادة تشغيل نفس الصف تفشل بـ 409 (سلوك متوقّع).
- **قفل الملف** بإعادة التسمية إلى `DONE_` ضروري لأن الـ Schedule يعمل كل دقيقة — بدونه يُعالج الملف مرتين.
- **استخراج الصور** يستخدم Set لإزالة التكرار — **لا** تستخدم نمط `arr1 || arr2`.
- عقدتا `sendAndWait` تحتاجان `responseType: "approval"` وإلا لن تظهر أزرار الموافقة.

## غير مُفعّل حالياً

- **`app.n8n_webhook_url` / `app.n8n_webhook_secret`** في Postgres غير مضبوطين، فمُشغّل `trg_category_visibility` (إشعار n8n عند إخفاء قسم) لا يرسل شيئاً.
  هذا **مقصود**: لوحة التحكم تستدعي `revalidateTag` مباشرة داخل `/api/admin/categories`، فالكاش يتحدّث فوراً بدون n8n.
- **Meilisearch reseed** بعد الإدخال (`scripts/seed-meilisearch.ts`) — فكرة تحسين لم تُنفَّذ.
