/**
 * docs/build-admin-guide.js — regenerates ../LevelX-Admin-Guide.docx
 *
 * Run:  npx --yes -p docx node docs/build-admin-guide.js LevelX-Admin-Guide.docx
 *   or: npm i -g docx  &&  node docs/build-admin-guide.js LevelX-Admin-Guide.docx
 *
 * `docx` is deliberately NOT a dependency of this app — it is an authoring tool
 * for this one script, not something the storefront ships. It was removed from
 * package.json on 2026-08-03 for exactly that reason.
 *
 * The guide is written for a non-technical store operator. When the admin UI
 * changes, edit this file and re-run it — do not hand-edit the .docx, or the
 * next regeneration silently discards your edit.
 */
const fs = require("fs");

// Resolve `docx` from the app, a global install, or NODE_PATH — in that order.
function loadDocx() {
  const tries = [
    () => require("docx"),
    () => require(require("child_process").execSync("npm root -g").toString().trim() + "/docx"),
  ];
  for (const t of tries) { try { return t(); } catch { /* next */ } }
  throw new Error("Cannot find the 'docx' package. Run: npm i -g docx");
}
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  LevelFormat, PageBreak,
} = loadDocx();

const W = 9026;                      // content width (A4 minus 1" margins)
const MINT = "24BE90";
const INK = "1A1A1A";
const GREY = "5B6470";
const AMBER = "B45309";
const RED = "B91C1C";

// ── helpers ──────────────────────────────────────────────────────────────────
const R = (text, o = {}) => new TextRun({ text, rightToLeft: true, font: "Segoe UI", ...o });
const RL = (text, o = {}) => new TextRun({ text, rightToLeft: false, font: "Consolas", ...o }); // latin/code

const P = (children, o = {}) =>
  new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, children, spacing: { after: 120 }, ...o });

const Body = (text, o = {}) => P([R(text, { size: 21, color: INK })], { spacing: { after: 160, line: 300 }, ...o });

const H1 = (text) =>
  new Paragraph({
    bidirectional: true, alignment: AlignmentType.RIGHT, heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: MINT, space: 6 } },
    children: [R(text, { size: 30, bold: true, color: INK })],
  });

const H2 = (text) =>
  new Paragraph({
    bidirectional: true, alignment: AlignmentType.RIGHT, heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [R(text, { size: 24, bold: true, color: INK })],
  });

const Bullet = (children, level = 0) =>
  new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, numbering: { reference: "bul", level },
    spacing: { after: 90, line: 290 }, children });

const Step = (children) =>
  new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, numbering: { reference: "num", level: 0 },
    spacing: { after: 90, line: 290 }, children });

// callout box
const Note = (title, lines, color, bg) => {
  const kids = [P([R(title, { size: 21, bold: true, color })], { spacing: { after: 80 } })];
  lines.forEach((ln) => kids.push(P(ln, { spacing: { after: 60, line: 290 } })));
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W], visuallyRightToLeft: true,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: color },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: color },
      left: { style: BorderStyle.SINGLE, size: 18, color: color },
      right: { style: BorderStyle.SINGLE, size: 18, color: color },
    },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: bg },
      margins: { top: 160, bottom: 160, left: 200, right: 200 },
      children: kids,
    })] })],
  });
};
const Warn = (t, l) => Note(t, l, AMBER, "FEF3C7");
const Danger = (t, l) => Note(t, l, RED, "FEE2E2");
const Info = (t, l) => Note(t, l, "0F766E", "ECFDF5");

// table
const Tbl = (headers, rows, widths) => {
  const mk = (txt, opts, w) => new TableCell({
    width: { size: w, type: WidthType.DXA },
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    shading: opts.head ? { type: ShadingType.CLEAR, fill: "F1F5F4" } : undefined,
    children: [P(
      Array.isArray(txt) ? txt : [R(txt, { size: 19, bold: !!opts.head, color: opts.head ? INK : GREY })],
      { spacing: { after: 0 } }
    )],
  });
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: widths, visuallyRightToLeft: true,
    borders: {
      top:{style:BorderStyle.SINGLE,size:2,color:"D8DEDC"}, bottom:{style:BorderStyle.SINGLE,size:2,color:"D8DEDC"},
      left:{style:BorderStyle.SINGLE,size:2,color:"D8DEDC"}, right:{style:BorderStyle.SINGLE,size:2,color:"D8DEDC"},
      insideHorizontal:{style:BorderStyle.SINGLE,size:2,color:"E8EDEB"}, insideVertical:{style:BorderStyle.SINGLE,size:2,color:"E8EDEB"},
    },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h,i)=>mk(h,{head:true},widths[i])) }),
      ...rows.map((r)=> new TableRow({ children: r.map((c,i)=>mk(c,{},widths[i])) })),
    ],
  });
};

const Gap = (h = 200) => new Paragraph({ text: "", spacing: { after: h } });

// ── document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bul", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.RIGHT,
          style: { paragraph: { indent: { right: 460, hanging: 240 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.RIGHT,
          style: { paragraph: { indent: { right: 860, hanging: 240 } } } },
      ]},
      { reference: "num", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.RIGHT,
          style: { paragraph: { indent: { right: 460, hanging: 280 } } } },
      ]},
    ],
  },
  styles: { default: { document: { run: { font: "Segoe UI", size: 21 } } } },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      // ══ COVER ══
      Gap(1400),
      P([R("LevelX", { size: 60, bold: true, color: MINT })], { alignment: AlignmentType.CENTER, spacing:{after:80} }),
      P([R("دليل تشغيل لوحة التحكم", { size: 44, bold: true, color: INK })], { alignment: AlignmentType.CENTER, spacing:{after:120} }),
      P([R("متجر الإلكترونيات والإكسسوارات — السوق المصري", { size: 22, color: GREY })], { alignment: AlignmentType.CENTER, spacing:{after:500} }),
      Tbl(
        ["البند", "القيمة"],
        [
          ["إصدار الدليل", [RL("2.0", { size: 19, bold: true, color: INK })]],
          ["تاريخ التحديث", [R("٤ أغسطس ٢٠٢٦", { size: 19, color: GREY })]],
          ["الموقع", [RL("levelx-team.vercel.app", { size: 18, color: GREY })]],
          ["رابط اللوحة", [RL("/ar/dashboard", { size: 18, bold: true, color: INK })]],
          ["لغة اللوحة", [R("الإنجليزية فقط", { size: 19, color: GREY })]],
        ],
        [3000, 6026]
      ),
      Gap(400),
      Warn("⚠️ هذا الإصدار يُلغي الإصدار ١.٠ بالكامل", [
        [R("الإصدار السابق (أبريل ٢٠٢٦) كان يصف لوحة تحكم مختلفة. أهم ما كان غلطاً فيه: رابط اللوحة كان مكتوباً ", {size:20,color:INK}), RL("/ar/admin", {size:19,bold:true,color:RED}), R(" وهو رابط ", {size:20,color:INK}), R("غير موجود", {size:20,bold:true,color:RED}), R("؛ والرابط الصحيح هو ", {size:20,color:INK}), RL("/ar/dashboard", {size:19,bold:true,color:INK}), R(". كما وصف قسمَي «العملاء» و«الإعدادات» وهما غير موجودين في اللوحة.", {size:20,color:INK})],
        [R("احذف أي نسخة قديمة مطبوعة.", { size: 20, bold: true, color: AMBER })],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══ 1 ══
      H1("١. ثلاث حقائق اقرأها قبل أي شيء"),
      Body("لو مقريتش غير صفحة واحدة من الدليل ده، خليها دي. التلات حاجات دول بيفسّروا أغلب المشاكل اللي بتحصل."),

      Danger("١) المنتج من غير «سعر» بيختفي تماماً", [
        [R("المنتج اللي مالوش ", {size:20,color:INK}), R("Variant", {size:19,bold:true,color:INK}), R(" (يعني مالوش سعر ومخزون) ", {size:20,color:INK}), R("مش هيظهر", {size:20,bold:true,color:RED}), R(" في أي صفحة: لا في القائمة، لا في القسم، ولا في البحث — حتى لو حالته «منشور». ده أشهر سبب لجملة «أنا ضفت المنتج ومش لاقيه».", {size:20,color:INK})],
        [R("الحل: افتح المنتج وتأكد إن فيه صف سعر واحد على الأقل تحت Variants.", { size: 20, color: INK })],
      ]),
      Gap(160),
      Danger("٢) الـ SKU والسعر إجباريين — والرسالة بتسمّي الخانة", [
        [R("سيب ", {size:20,color:INK}), RL("SKU Code", {size:19,bold:true,color:INK}), R(" أو ", {size:20,color:INK}), RL("Regular Price", {size:19,bold:true,color:INK}), R(" فاضية والحفظ هيترفض برسالة بتقول الخانة ورقم الصف بالظبط — ", {size:20,color:INK}), RL("Variant 1 — SKU is required", {size:18,bold:true,color:RED}), R(" أو ", {size:20,color:INK}), RL("Variant 1 — Price is required", {size:18,bold:true,color:RED}), R(".", {size:20,color:INK})],
        [R("والسعر بصفر أو بالسالب مرفوض كمان: ", {size:20,color:INK}), RL("Variant 1 — Price must be greater than zero", {size:18,bold:true,color:RED})],
        [R("ملاحظة تاريخية: السعر الفاضي كان قبل كده ", {size:20,color:INK}), R("بيتحفظ صفر في صمت", {size:20,bold:true,color:AMBER}), R(" والمنتج يتعرض للبيع بصفر جنيه. اتقفلت في ٤ أغسطس ٢٠٢٦ — بس لو عندك منتجات قديمة، راجع أسعارها.", {size:20,color:INK})],
      ]),
      Gap(160),
      Danger("٣) أرقام الصفحة الرئيسية للوحة «تجريبية»", [
        [R("الكروت الأربعة والرسوم البيانية في أول صفحة اللوحة ", {size:20,color:INK}), R("بيانات وهمية ثابتة", {size:20,bold:true,color:RED}), R(" — مش مبيعاتك الحقيقية. فيه شريط أصفر فوقها بيقول كده، وكل كارت عليه علامة «Demo». ", {size:20,color:INK}), R("المبيعات الحقيقية في صفحة الطلبات وحدها.", {size:20,bold:true,color:INK})],
      ]),

      // ══ 2 ══
      H1("٢. الدخول إلى لوحة التحكم"),
      Tbl(
        ["الغرض", "الرابط"],
        [
          ["تسجيل الدخول", [RL("levelx-team.vercel.app/ar/login", { size: 18, color: INK })]],
          ["لوحة التحكم", [RL("levelx-team.vercel.app/ar/dashboard", { size: 18, bold: true, color: INK })]],
          ["نسيت كلمة المرور", [R("زر داخل صفحة الدخول — بيبعت رابط على بريدك", { size: 19, color: GREY })]],
        ],
        [2600, 6426]
      ),
      Gap(200),
      Body("الدخول مسموح فقط للحسابات المسجَّلة كمشرف. لو دخلت بحساب عادي هتترجع لصفحة الدخول تاني."),
      Info("ℹ️ اللوحة بالإنجليزية", [
        [R("صفحات المتجر بالعربي والإنجليزي، لكن ", {size:20,color:INK}), R("شاشات الإدارة نفسها إنجليزية فقط", {size:20,bold:true,color:INK}), R(". الدليل ده بيدّيك معنى كل زر بالعربي.", {size:20,color:INK})],
      ]),

      H2("أقسام اللوحة الأربعة"),
      Tbl(
        ["القسم في اللوحة", "معناه", "الفصل"],
        [
          [[RL("Orders", { size: 19, bold: true, color: INK })], "الطلبات — متابعتها وتغيير حالتها", "٤"],
          [[RL("Catalog", { size: 19, bold: true, color: INK })], "المنتجات — إضافة وتعديل ونشر", "٥"],
          [[RL("Categories", { size: 19, bold: true, color: INK })], "الأقسام — إنشاء وترتيب وإظهار", "٧"],
          [[RL("Storefront Builder", { size: 19, bold: true, color: INK })], "شكل الصفحة الرئيسية والألوان", "٨"],
        ],
        [2700, 5126, 1200]
      ),
      Gap(200),
      Warn("لا يوجد قسم «عملاء» ولا قسم «إعدادات»", [
        [R("الإصدار القديم من الدليل كان بيذكرهم. مفيش شاشة عملاء في اللوحة — بيانات العميل بتظهر جوّه الطلب نفسه (فصل ٤).", { size: 20, color: INK })],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══ 3 ══
      H1("٣. صفحة المؤشرات (الصفحة الأولى)"),
      Body("أول ما تدخل اللوحة هتلاقي أربع كروت أرقام وأربعة رسوم بيانية. زي ما اتقال في الفصل ١: كل ده بيانات تجريبية ثابتة."),
      Bullet([R("الشريط الأصفر في الأعلى بيقول إن دي بيانات عرض، وفيه زر بيوديك على الطلبات الحقيقية.", { size: 21, color: INK })]),
      Bullet([R("أزرار الفترات (7d / 30d / 90d / 12m) ", { size: 21, color: INK }), R("شكلية فقط", { size: 21, bold: true, color: AMBER }), R(" — الرسم مش بيتغير لما تضغط عليها.", { size: 21, color: INK })]),
      Bullet([R("تحت الرسوم هتلاقي اختصارات للأقسام التلاتة التانية.", { size: 21, color: INK })]),
      Gap(120),
      Body("لما الأرقام دي تتوصّل بالطلبات الحقيقية، الشريط الأصفر وعلامات Demo هيتشالوا. لحد ساعتها اعتمد على صفحة الطلبات."),

      // ══ 4 ══
      H1("٤. الطلبات — Orders"),
      Body("دي الشاشة الوحيدة اللي فيها أرقام حقيقية. كل طلب بيتعمل من الموقع بيظهر هنا فوراً."),

      H2("٤.١ رقم الطلب"),
      P([R("رقم الطلب بالشكل ", {size:21,color:INK}), RL("LX-YYMMDD-NNNN", {size:20,bold:true,color:INK}), R(" — مثال: ", {size:21,color:INK}), RL("LX-260803-1011", {size:20,color:GREY}), R(". الشكل ده متعمّد عشان العميل يقدر يقراه في التليفون.", {size:21,color:INK})]),

      H2("٤.٢ حالات الطلب"),
      Tbl(
        ["الحالة في اللوحة", "معناها", "متى تستخدمها"],
        [
          [[RL("Pending", { size: 19, bold: true, color: INK })], "طلب جديد لسه ما اتأكدش", "الحالة الأولى تلقائياً"],
          [[RL("Confirmed", { size: 19, bold: true, color: INK })], "اتصلت بالعميل وأكّد", "بعد المكالمة"],
          [[RL("Shipped", { size: 19, bold: true, color: INK })], "خرج مع المندوب", "عند التسليم للشحن"],
          [[RL("Delivered", { size: 19, bold: true, color: INK })], "وصل واتحصّل الفلوس", "بعد التحصيل فقط"],
          [[RL("Cancelled", { size: 19, bold: true, color: INK })], "ملغي", "رفض العميل أو تعذّر التوصيل"],
        ],
        [2200, 3626, 3200]
      ),
      Gap(200),
      Info("💡 «Delivered» معناها إن الفلوس اتحصّلت فعلاً", [
        [R("حساب الإيرادات في اللوحة بيعدّ الطلبات المسلَّمة ", {size:20,color:INK}), R("فقط", {size:20,bold:true,color:INK}), R(" — لأن الدفع عند الاستلام مش فلوس حقيقية إلا لما المندوب يحصّلها. متحطّش الطلب Delivered قبل التحصيل وإلا الأرقام هتبقى غلط.", {size:20,color:INK})],
      ]),

      H2("٤.٣ اللي تقدر وما تقدرش تعدّله"),
      Bullet([R("تقدر تغيّر ", { size: 21, color: INK }), R("الحالة فقط", { size: 21, bold: true, color: INK }), R(".", { size: 21, color: INK })]),
      Bullet([R("مش هتقدر تعدّل اسم العميل أو تليفونه أو عنوانه أو المبالغ — ", { size: 21, color: INK }), R("وده مقصود", { size: 21, bold: true, color: INK }), R(": الطلب سجل تاريخي، ولو أمكن تعديل المبالغ يبقى ممكن حد يغيّر فاتورة بعد ما اتعملت.", { size: 21, color: INK })]),
      Bullet([R("لو العميل عايز يغيّر عنوانه، الغِ الطلب واعمل واحد جديد.", { size: 21, color: INK })]),

      H2("٤.٤ البحث والفلترة"),
      Bullet([R("خانة البحث بتدوّر برقم الطلب أو اسم العميل أو التليفون.", { size: 21, color: INK })]),
      Bullet([R("قائمة ", { size: 21, color: INK }), RL("All statuses", { size: 20, color: INK }), R(" بتفلتر بالحالة.", { size: 21, color: INK })]),
      Bullet([R("اضغط على أي طلب عشان يفتح ويوريك المنتجات والعنوان والملاحظات.", { size: 21, color: INK })]),
      Gap(120),
      Body("طريقة الدفع الوحيدة حالياً هي الدفع عند الاستلام. ضريبة القيمة المضافة ١٤٪ محسوبة تلقائياً."),

      new Paragraph({ children: [new PageBreak()] }),

      // ══ 5 ══
      H1("٥. المنتجات — Catalog"),

      H2("٥.١ إضافة منتج"),
      Step([R("من اللوحة اضغط ", { size: 21, color: INK }), RL("Catalog", { size: 20, bold: true, color: INK })]),
      Step([R("اضغط زر الإضافة — هتفتح صفحة كاملة (مش نافذة صغيرة)", { size: 21, color: INK })]),
      Step([R("املأ البيانات الأساسية (الجدول تحت)", { size: 21, color: INK })]),
      Step([R("انزل لقسم ", { size: 21, color: INK }), RL("Variants", { size: 20, bold: true, color: INK }), R(" وضيف صف سعر واحد على الأقل — ", { size: 21, color: INK }), R("إجباري", { size: 21, bold: true, color: RED })]),
      Step([R("اكتب العنوان والوصف بالعربي والإنجليزي من التبويبين", { size: 21, color: INK })]),
      Step([R("ارفع الصور من مربع الصور — اسحب وسيب، أو اضغط واختار (فصل ٦)", { size: 21, color: INK })]),
      Step([R("احفظ", { size: 21, color: INK })]),
      Step([R("من قائمة المنتجات فعّل مفتاح النشر عشان يظهر للزباين", { size: 21, color: INK })]),

      H2("٥.٢ الحقول الأساسية"),
      Tbl(
        ["الحقل في الشاشة", "معناه", "مطلوب؟"],
        [
          [[RL("Product Name", { size: 19, bold: true, color: INK })], "اسم المنتج الأساسي", "نعم"],
          [[RL("Brand", { size: 19, color: INK })], "الماركة", "لا"],
          [[RL("URL Slug", { size: 19, color: INK })], "الاسم اللي بيظهر في الرابط — إنجليزي وبشرطات", "نعم عملياً"],
          [[RL("Category", { size: 19, color: INK })], "القسم", "نعم"],
          [[RL("Description", { size: 19, color: INK })], "الوصف", "لا"],
          [[RL("Specs", { size: 19, color: INK })], "المواصفات — بند وقيمة، ضيف اللي تحتاجه", "لا"],
        ],
        [2600, 5226, 1200]
      ),
      Gap(200),
      Warn("المنتج من غير Slug مش هيظهر في القوائم", [
        [R("زي المنتج من غير سعر بالظبط. اكتب الاسم بالإنجليزي بحروف صغيرة وشرطات، مثال: ", {size:20,color:INK}), RL("iphone-14-pro", {size:19,bold:true,color:INK})],
      ]),

      H2("٥.٣ قسم الأسعار — Variants"),
      Body("كل صف هنا بيمثّل «نسخة» من المنتج بسعر وحالة ومخزون مستقلين. لازم صف واحد على الأقل."),
      Tbl(
        ["الحقل", "معناه"],
        [
          [[RL("SKU Code", { size: 19, bold: true, color: INK })], "كود داخلي للمنتج — إجباري"],
          [[RL("Regular Price (EGP)", { size: 19, bold: true, color: INK })], "السعر بالجنيه المصري — إجباري"],
          [[RL("Sale Price (EGP)", { size: 19, color: INK })], "سعر التخفيض — اختياري، بيظهر والأصلي مشطوب"],
          [[RL("Discount Badge", { size: 19, color: INK })], "كلمة صغيرة تظهر على المنتج، مثل: خصم"],
          [[RL("Stock Qty", { size: 19, color: INK })], "الكمية المتاحة"],
          [[RL("Condition Grade", { size: 19, color: INK })], "حالة الجهاز — أربع درجات، الجدول تحت"],
        ],
        [2900, 6126]
      ),
      Gap(200),
      Tbl(
        ["الدرجة", "معناها"],
        [
          [[RL("Premium", { size: 19, bold: true, color: INK })], "كالجديد تماماً، بدون أي عيب"],
          [[RL("Excellent", { size: 19, bold: true, color: INK })], "علامات بسيطة جداً، مختبَر بالكامل"],
          [[RL("Good", { size: 19, bold: true, color: INK })], "استعمال خفيف، يعمل بكفاءة"],
          [[RL("Fair", { size: 19, bold: true, color: INK })], "علامات استعمال ظاهرة، يعمل بالكامل"],
        ],
        [2400, 6626]
      ),

      H2("٥.٤ النشر والإخفاء"),
      Body("في قائمة المنتجات فيه مفتاح صغير في عمود الحالة:"),
      Bullet([R("أخضر = منشور وظاهر للزباين", { size: 21, color: INK })]),
      Bullet([R("رمادي = مسودة، محفوظ لكن مخفي", { size: 21, color: INK })]),
      Gap(120),
      Info("✅ الإخفاء أأمن من الحذف", [
        [R("لو منتج خلص أو اتوقف، ", {size:20,color:INK}), R("اقفل المفتاح", {size:20,bold:true,color:INK}), R(" بدل ما تحذفه. كده بياناته وصوره وتاريخه بيفضلوا، وترجّعه في ثانية.", {size:20,color:INK})],
      ]),

      H2("٥.٥ الحذف"),
      Body("زر الحذف بيطلّع رسالة تأكيد اسمها Delete Product?. الحذف نهائي وبيشيل معاه الأسعار والصور والترجمات."),
      Danger("الحذف لا رجعة فيه", [
        [R("مفيش سلة محذوفات ومفيش زر تراجع. ", {size:20,color:INK}), R("متستخدمهوش إلا لو المنتج اتضاف بالغلط أصلاً.", {size:20,bold:true,color:RED})],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══ 6 ══
      H1("٦. الصور"),
      Body("الرفع من اللوحة شغّال: اسحب الصورة على المربع في صفحة المنتج وسيبها، أو اضغط عليه واختار الملفات."),
      Gap(200),
      H2("٦.١ الموقع بيعالج الصورة قبل ما يرفعها"),
      Body("مش محتاج تظبّط المقاسات بنفسك. المتصفح بيعمل الآتي على كل صورة قبل ما تتبعت:"),
      Bullet([R("بيحوّلها لمربّع ١٥٠٠ × ١٥٠٠", { size: 21, color: INK })]),
      Bullet([R("بيحطّ خلفية بيضا في الفراغ بدل ما يقص أو يشوّه", { size: 21, color: INK })]),
      Bullet([R("بيحوّلها ", { size: 21, color: INK }), RL("WebP", { size: 20, bold: true, color: INK }), R(" وبينزل بالجودة تدريجياً لحد ما يوصل أقل من ٥٠٠ كيلوبايت", { size: 21, color: INK })]),
      Bullet([R("مبيكبّرش الصور الصغيرة — صورة ٦٠٠ بكسل بتفضل ٦٠٠ بكسل", { size: 21, color: INK })]),
      Gap(240),
      H2("٦.٢ حدود الرفع"),
      Tbl(
        ["البند", "الحد", "ملاحظة"],
        [
          ["الصيغ المقبولة", "JPG · PNG · WebP · AVIF", "أي حاجة تانية بترجع برسالة"],
          ["أقصى حجم للملف", "٥ ميجابايت", "قبل المعالجة"],
          ["أقصى عدد في المرة", "١٠ صور", "ارفع على دفعات لو أكتر"],
          ["العدد للمنتج", "من ١ إلى ٦", "الأولى هي الرئيسية"],
          ["المعدّل", "٣٠ ملف في الدقيقة", "حد الحماية من الإرهاق"],
        ],
        [2200, 3226, 3600]
      ),
      Gap(240),
      H2("٦.٣ أحسن أصل ترفعه"),
      Tbl(
        ["البند", "الأفضل", "ليه"],
        [
          ["المقاس", "١٥٠٠ × ١٥٠٠ أو أكبر", "المعالجة بتصغّر ومبتكبّرش"],
          ["أصغر مقاس مفيد", "١٠٠٠ × ١٠٠٠ بكسل", "أقل من كده بتبان ضبابية"],
          ["الشكل", "مربّع ١:١", "المستطيلة بيتحط حواليها إطار أبيض"],
          ["الخلفية", "بيضاء أو شفافة", "مش صور دعائية"],
        ],
        [2200, 3226, 3600]
      ),
      Gap(240),
      Warn("لو الرفع رجع برسالة", [
        [R("أشهر سبب: ", { size: 20, color: INK }), R("الجلسة انتهت", { size: 20, bold: true, color: AMBER }), R(" — الرسالة بتقول إن الجلسة خلصت أو إن الحساب مش مشرف. سجّل دخول تاني وأعد الرفع.", { size: 20, color: INK })],
        [R("الرسالة بتسمّي كل ملف فشل والسبب بتاعه، والملفات اللي نجحت بتتحفظ عادي — مش بتتلغي كلها بسبب ملف واحد.", { size: 20, color: INK })],
      ]),
      Gap(200),
      Info("فيه طريق تاني للدفعات الكبيرة", [
        [R("لسه فيه سكربت خارجي (", { size: 20, color: INK }), RL("levelx-images.py", { size: 19, color: INK }), R(") بيعمل نفس المعالجة لعشرات المنتجات مرة واحدة. بيحتاج مفتاح خدمة وتشغيل من سطر الأوامر، فهو للاستيراد بالجملة — مش للاستخدام اليومي. الرفع من اللوحة بيكفي للمنتج الواحد.", { size: 20, color: INK })],
      ]),
      Gap(200),
      Warn("صور السلايدر في الصفحة الرئيسية مش من هنا", [
        [R("الصور الكبيرة اللي فوق في الصفحة الرئيسية ", { size: 20, color: INK }), R("مكتوبة جوّه الكود", { size: 20, bold: true, color: AMBER }), R(" ومفيش شاشة تتحكم فيها. تغييرها محتاج تعديل في الكود ونشر نسخة جديدة — مش عملية رفع.", { size: 20, color: INK })],
      ]),

      // ══ 7 ══
      H1("٧. الأقسام — Categories"),
      Body("الأقسام هي اللي بتظهر في شريط أعلى الموقع وفي مربعات الصفحة الرئيسية. القسم ممكن يكون تحت قسم أكبر."),
      Tbl(
        ["الحقل", "معناه"],
        [
          [[RL("Name", { size: 19, bold: true, color: INK })], "اسم القسم — إجباري"],
          [[RL("Slug", { size: 19, color: INK })], "اسمه في الرابط"],
          [[RL("Parent Category", { size: 19, color: INK })], "القسم الأكبر اللي تحته — سيبها فاضية لو رئيسي"],
          [[RL("Visible to customers", { size: 19, color: INK })], "يظهر للزباين أو لأ"],
          [[RL("Show on home page", { size: 19, color: INK })], "يظهر في مربعات الصفحة الرئيسية"],
          [[RL("Order", { size: 19, color: INK })], "الترتيب — الرقم الأصغر بيظهر الأول"],
          [[RL("Icon", { size: 19, color: INK })], "الأيقونة"],
          [[RL("Colour", { size: 19, color: INK })], "لون المربع"],
          [[RL("Short label", { size: 19, color: INK })], "اسم مختصر لو الأصلي طويل"],
        ],
        [2900, 6126]
      ),
      Gap(200),
      Info("👁️ فيه معاينة حيّة", [
        [R("جنب الحقول هتلاقي ", {size:20,color:INK}), RL("Preview", {size:19,bold:true,color:INK}), R(" بيوريك شكل المربع قبل ما تحفظ.", {size:20,color:INK})],
      ]),
      Gap(160),
      Warn("حذف القسم بيأثر على منتجاته", [
        [R("لو حذفت قسم، ارتباط منتجاته بيه بيتشال. الأأمن إنك تقفل ", {size:20,color:INK}), RL("Visible to customers", {size:19,bold:true,color:INK}), R(" بدل الحذف.", {size:20,color:INK})],
      ]),

      // ══ 8 ══
      H1("٨. واجهة المتجر — Storefront Builder"),
      Body("من هنا بتتحكم في شكل الصفحة الرئيسية وألوان العلامة التجارية."),
      Bullet([RL("Theme & Brand Colours", { size: 20, bold: true, color: INK }), R(" — الألوان الأساسية ودرجة استدارة الحواف وشكل الكروت.", { size: 21, color: INK })]),
      Bullet([RL("Home Page Sections", { size: 20, bold: true, color: INK }), R(" — ترتيب أقسام الصفحة الرئيسية، وإظهار أو إخفاء كل قسم.", { size: 21, color: INK })]),
      Bullet([RL("Live Preview", { size: 20, bold: true, color: INK }), R(" — معاينة قبل الحفظ.", { size: 21, color: INK })]),
      Bullet([RL("Save Changes", { size: 20, bold: true, color: INK }), R(" — التغيير مش بيتطبّق غير لما تضغط الزر ده.", { size: 21, color: INK })]),
      Gap(160),
      Warn("غيّر لون واحد في المرة", [
        [R("الألوان مترابطة مع بعضها. لو غيّرت كذا لون مرة واحدة وطلع الشكل وحش، هيبقى صعب تعرف مين السبب. غيّر، عاين، احفظ، بُص على الموقع — وبعدين اللي بعده.", { size: 20, color: INK })],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ══ 9 ══
      H1("٩. مشاكل شائعة وحلولها"),
      Tbl(
        ["المشكلة", "السبب الأرجح", "الحل"],
        [
          ["ضفت منتج ومش لاقيه في الموقع", "مالوش سعر (Variant)", "افتحه وضيف صف سعر"],
          ["المنتج محفوظ بس مش ظاهر", "مفتاح النشر مقفول", "افتح المفتاح من قائمة المنتجات"],
          ["المنتج مش بيظهر في القسم", "مالوش Slug أو مالوش قسم", "املأ الاتنين واحفظ"],
          ["الحفظ اترفض برسالة حمرا", "خانة إجبارية فاضية — غالباً SKU أو السعر", "الرسالة بتسمّي الخانة والصف — روح عليها"],
          ["رفع الصورة بيدّي رسالة", "الجلسة انتهت، أو نوع/حجم الملف مرفوض", "سجّل دخول تاني، وراجع حدود فصل ٦"],
          ["عدّلت وما اتغيرش في الموقع", "الموقع بيخزّن مؤقتاً لمدة ساعة", "استنى شوية وحدّث الصفحة"],
          ["أرقام المبيعات غريبة", "دي بيانات تجريبية", "بُص في صفحة الطلبات"],
          ["مش عارف أدخل اللوحة", "الحساب مش مشرف، أو كلمة السر غلط", "استخدم «نسيت كلمة المرور؟»"],
          ["الأقسام ظاهرة غلط في الرئيسية", "الترتيب أو Show on home page", "عدّل Order وافتح المفتاح"],
        ],
        [2700, 3126, 3200]
      ),

      // ══ 10 ══
      H1("١٠. حاجات اللوحة ما بتعملهاش"),
      Body("عشان متضيّعش وقت تدوّر عليها — دي مش موجودة دلوقتي:"),
      Bullet([R("مفيش شاشة عملاء — بيانات العميل جوّه الطلب.", { size: 21, color: INK })]),
      Bullet([R("مفيش تقارير أو تصدير Excel.", { size: 21, color: INK })]),
      Bullet([R("مفيش خصم تلقائي من المخزون بعد الطلب — المخزون بيتراجع يدوي.", { size: 21, color: INK })]),
      Bullet([R("مفيش دفع بالكارت — الدفع عند الاستلام فقط.", { size: 21, color: INK })]),
      Bullet([R("مفيش ربط بشركات الشحن — الشحن بيتظبط برّه النظام.", { size: 21, color: INK })]),
      Bullet([R("مفيش رسائل تلقائية للعميل عند تغيير حالة الطلب.", { size: 21, color: INK })]),
      Bullet([R("مفيش صلاحيات متدرجة — أي مشرف يقدر يعمل أي حاجة.", { size: 21, color: INK })]),
      Gap(300),

      P([R("انتهى الدليل — الإصدار ٢.١", { size: 20, bold: true, color: GREY })], { alignment: AlignmentType.CENTER }),
      P([R("لو لقيت حاجة في الدليل ده مش مطابقة للشاشة، الشاشة هي الصح — الدليل ده اتحدّث في ٤ أغسطس ٢٠٢٦.", { size: 19, color: GREY })], { alignment: AlignmentType.CENTER }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = process.argv[2] || "LevelX-Admin-Guide.docx";
  fs.writeFileSync(out, buf);
  console.log("written:", out, (buf.length / 1024).toFixed(1) + " KB");
});
