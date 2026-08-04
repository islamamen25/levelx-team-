/**
 * Generates LevelX-Admin-Guide-Simple.docx — the beginner version.
 *
 * Deliberately different from LevelX-Admin-Guide.docx: that one is a reference
 * (tables of fields, exact option names). This one is a *tutorial* — short
 * sentences, one idea per line, every English word on screen paired with what
 * it means, and the first thing a new person will get wrong called out early.
 *
 * Run: node build-simple-guide.js <output.docx>
 */
const fs = require("fs");

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

const W = 9026;
const MINT = "24BE90";
const INK = "1A1A1A";
const GREY = "5B6470";
const AMBER = "B45309";
const RED = "B91C1C";
const BLUE = "1D4ED8";

const R  = (t, o = {}) => new TextRun({ text: t, rightToLeft: true, font: "Segoe UI", ...o });
const RL = (t, o = {}) => new TextRun({ text: t, rightToLeft: false, font: "Consolas", ...o });

const P = (kids, o = {}) =>
  new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, children: kids, spacing: { after: 130, line: 310 }, ...o });

const Body = (t, o = {}) => P([R(t, { size: 22, color: INK })], o);

const H1 = (t) => new Paragraph({
  bidirectional: true, alignment: AlignmentType.RIGHT, heading: HeadingLevel.HEADING_1,
  spacing: { before: 420, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: MINT, space: 6 } },
  children: [R(t, { size: 32, bold: true, color: INK })],
});

const H2 = (t) => new Paragraph({
  bidirectional: true, alignment: AlignmentType.RIGHT, heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 150 },
  children: [R(t, { size: 25, bold: true, color: INK })],
});

const Step = (kids) => new Paragraph({
  bidirectional: true, alignment: AlignmentType.RIGHT, numbering: { reference: "steps", level: 0 },
  spacing: { after: 130, line: 310 }, children: kids,
});

const Bullet = (kids) => new Paragraph({
  bidirectional: true, alignment: AlignmentType.RIGHT, numbering: { reference: "bul", level: 0 },
  spacing: { after: 100, line: 300 }, children: kids,
});

const Box = (title, lines, color, bg) => {
  const kids = [P([R(title, { size: 23, bold: true, color })], { spacing: { after: 90 } })];
  lines.forEach((l) => kids.push(P(l, { spacing: { after: 70, line: 305 } })));
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W], visuallyRightToLeft: true,
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 2,  color },
      bottom: { style: BorderStyle.SINGLE, size: 2,  color },
      left:   { style: BorderStyle.SINGLE, size: 20, color },
      right:  { style: BorderStyle.SINGLE, size: 20, color },
    },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: bg },
      margins: { top: 170, bottom: 170, left: 210, right: 210 },
      children: kids,
    })] })],
  });
};
const Danger = (t, l) => Box(t, l, RED,   "FEE2E2");
const Warn   = (t, l) => Box(t, l, AMBER, "FEF3C7");
const Tip    = (t, l) => Box(t, l, "0F766E", "ECFDF5");
const Note   = (t, l) => Box(t, l, BLUE,  "EFF6FF");

const Tbl = (headers, rows, widths) => {
  const cell = (txt, head, w) => new TableCell({
    width: { size: w, type: WidthType.DXA },
    margins: { top: 100, bottom: 100, left: 130, right: 130 },
    shading: head ? { type: ShadingType.CLEAR, fill: "F1F5F4" } : undefined,
    children: [P(Array.isArray(txt) ? txt : [R(txt, { size: 20, bold: !!head, color: head ? INK : GREY })], { spacing: { after: 0 } })],
  });
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: widths, visuallyRightToLeft: true,
    borders: {
      top:{style:BorderStyle.SINGLE,size:2,color:"D8DEDC"}, bottom:{style:BorderStyle.SINGLE,size:2,color:"D8DEDC"},
      left:{style:BorderStyle.SINGLE,size:2,color:"D8DEDC"}, right:{style:BorderStyle.SINGLE,size:2,color:"D8DEDC"},
      insideHorizontal:{style:BorderStyle.SINGLE,size:2,color:"E8EDEB"}, insideVertical:{style:BorderStyle.SINGLE,size:2,color:"E8EDEB"},
    },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h,i)=>cell(h,true,widths[i])) }),
      ...rows.map(r => new TableRow({ children: r.map((c,i)=>cell(c,false,widths[i])) })),
    ],
  });
};

const Gap = (h = 200) => new Paragraph({ text: "", spacing: { after: h } });

const doc = new Document({
  numbering: { config: [
    { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.RIGHT,
      style: { paragraph: { indent: { right: 460, hanging: 250 } } } }] },
    { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.RIGHT,
      style: { paragraph: { indent: { right: 500, hanging: 300 } } } }] },
  ]},
  styles: { default: { document: { run: { font: "Segoe UI", size: 22 } } } },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      Gap(1500),
      P([R("LevelX", { size: 64, bold: true, color: MINT })], { alignment: AlignmentType.CENTER, spacing:{after:100} }),
      P([R("دليل المبتدئين", { size: 46, bold: true, color: INK })], { alignment: AlignmentType.CENTER, spacing:{after:100} }),
      P([R("إزاي تشتغل على لوحة تحكم المتجر — من الصفر", { size: 24, color: GREY })], { alignment: AlignmentType.CENTER, spacing:{after:600} }),
      Note("📖 الدليل ده ليك لو دي أول مرة", [
        [R("مكتوب بلغة بسيطة وخطوة بخطوة. مش محتاج تعرف أي حاجة عن البرمجة.", { size: 22, color: INK })],
        [R("فيه دليل تاني اسمه ", { size: 22, color: INK }), RL("LevelX-Admin-Guide.docx", { size: 20, bold: true, color: INK }), R(" — ده مرجع فيه كل التفاصيل. ارجعله لما تبقى متعوّد.", { size: 22, color: INK })],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────
      H1("١. يعني إيه «لوحة التحكم»؟"),
      Body("تخيّل إن المتجر بتاعك محل حقيقي."),
      Bullet([R("الموقع اللي الزباين بيشوفوه = ", { size: 22, color: INK }), R("الفاترينة", { size: 22, bold: true, color: INK })]),
      Bullet([R("لوحة التحكم = ", { size: 22, color: INK }), R("المخزن ومكتب الإدارة", { size: 22, bold: true, color: INK }), R(" — الزباين مش بيشوفوه", { size: 22, color: INK })]),
      Gap(120),
      Body("من اللوحة بتحط منتجات، وتشوف الطلبات، وتغيّر شكل الصفحة الرئيسية."),

      Warn("⚠️ اللوحة مكتوبة بالإنجليزي", [
        [R("صفحات المتجر عربي وإنجليزي، لكن شاشات الإدارة إنجليزي بس. متقلقش — الدليل ده هيقولك معنى كل زر.", { size: 22, color: INK })],
      ]),

      // ─────────────────────────────────────
      H1("٢. إزاي تدخل"),
      Step([R("افتح الموقع: ", { size: 22, color: INK }), RL("levelx-team.vercel.app", { size: 20, bold: true, color: INK })]),
      Step([R("فوق على اليسار، جنب زرار اللغة، فيه ", { size: 22, color: INK }), R("أيقونة شخص 👤", { size: 22, bold: true, color: INK }), R(" — دوس عليها", { size: 22, color: INK })]),
      Step([R("اكتب إيميلك وكلمة المرور", { size: 22, color: INK })]),
      Step([R("دوس ", { size: 22, color: INK }), RL("Sign in", { size: 20, bold: true, color: INK }), R(" (يعني «دخول»)", { size: 22, color: INK })]),
      Gap(140),
      Tip("👁️ فيه أيقونة عين جنب خانة كلمة المرور", [
        [R("دوس عليها تشوف اللي بتكتبه. مفيدة عشان متغلطش وإنت مش شايف.", { size: 22, color: INK })],
      ]),
      Gap(160),
      Body("نسيت كلمة المرور؟ تحت الخانة فيه «نسيت كلمة المرور؟» — دوس، اكتب إيميلك، وهيجيلك رابط تعمل بيه كلمة جديدة."),

      // ─────────────────────────────────────
      H1("٣. أول حاجة تشوفها بعد الدخول"),
      Body("هتلاقي أربع مربعات فيها أرقام ورسوم بيانية."),
      Danger("🛑 الأرقام دي مش حقيقية!", [
        [R("دي ", { size: 22, color: INK }), R("أرقام تجريبية", { size: 22, bold: true, color: RED }), R(" حطّها المبرمج للعرض بس. مبيعاتك الحقيقية ", { size: 22, color: INK }), R("مش هنا", { size: 22, bold: true, color: RED }), R(".", { size: 22, color: INK })],
        [R("فيه شريط أصفر فوقهم بيقول كده، وكل مربع مكتوب عليه كلمة ", { size: 22, color: INK }), RL("Demo", { size: 20, bold: true, color: INK }), R(" يعني «عرض».", { size: 22, color: INK })],
        [R("عايز مبيعاتك الحقيقية؟ روح على ", { size: 22, color: INK }), RL("Orders", { size: 20, bold: true, color: INK }), R(" — الفصل الجاي.", { size: 22, color: INK })],
      ]),
      Gap(200),
      H2("الأربع أقسام اللي هتشتغل عليهم"),
      Tbl(
        ["الاسم في اللوحة", "معناه", "بتعمل بيه إيه"],
        [
          [[RL("Orders", { size: 20, bold: true, color: INK })], "الطلبات", "تشوف مين اشترى وتتابع التوصيل"],
          [[RL("Catalog", { size: 20, bold: true, color: INK })], "المنتجات", "تضيف وتعدّل المنتجات"],
          [[RL("Categories", { size: 20, bold: true, color: INK })], "الأقسام", "تنظّم المنتجات في مجموعات"],
          [[RL("Storefront Builder", { size: 20, bold: true, color: INK })], "شكل المتجر", "تغيّر الألوان وترتيب الصفحة"],
        ],
        [2500, 1900, 4626]
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────
      H1("٤. الطلبات — Orders"),
      Body("دي أهم شاشة عندك. كل واحد يشتري من الموقع، طلبه بيظهر هنا على طول."),

      H2("كل طلب له رقم"),
      P([R("شكله كده: ", { size: 22, color: INK }), RL("LX-260803-1011", { size: 21, bold: true, color: INK }), R(" — العميل بيقولهولك في التليفون عشان تلاقي طلبه بسرعة.", { size: 22, color: INK })]),

      H2("الطلب بيعدّي بخمس مراحل"),
      Body("زي ما الأوردر بيعدّي بمراحل في أي محل:"),
      Tbl(
        ["المرحلة", "معناها", "إمتى تحطها"],
        [
          [[RL("Pending", { size: 20, bold: true, color: INK })], "طلب جديد", "أول ما يجي — أوتوماتيك"],
          [[RL("Confirmed", { size: 20, bold: true, color: INK })], "اتأكد", "بعد ما تكلّم العميل ويوافق"],
          [[RL("Shipped", { size: 20, bold: true, color: INK })], "خرج", "لما تدّيه للمندوب"],
          [[RL("Delivered", { size: 20, bold: true, color: INK })], "اتسلّم", "لما المندوب يستلم الفلوس"],
          [[RL("Cancelled", { size: 20, bold: true, color: INK })], "ملغي", "لو العميل رفض"],
        ],
        [2100, 1700, 5226]
      ),
      Gap(200),
      Danger("🛑 غلطة شائعة: تحط Delivered بدري", [
        [R("متحطّش ", { size: 22, color: INK }), RL("Delivered", { size: 20, bold: true, color: INK }), R(" غير لما المندوب يكون ", { size: 22, color: INK }), R("استلم الفلوس بإيده", { size: 22, bold: true, color: RED }), R(".", { size: 22, color: INK })],
        [R("ليه؟ لأن النظام بيحسب إيراداتك من الطلبات المسلّمة بس. لو حطيتها بدري هتفتكر إنك كسبت فلوس لسه ما وصلتش.", { size: 22, color: INK })],
      ]),
      Gap(180),
      H2("حاجة مش هتقدر تعملها"),
      Body("مش هتقدر تعدّل اسم العميل ولا تليفونه ولا العنوان ولا السعر. تقدر تغيّر المرحلة بس."),
      Body("ده مقصود عشان حمايتك: الطلب زي الفاتورة، ولو أي حد قدر يغيّر مبالغها بعدين مش هتبقى فاتورة."),
      Body("العميل عايز يغيّر عنوانه؟ الغِ الطلب واعمله واحد جديد."),

      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────
      H1("٥. تضيف منتج جديد"),
      Body("دي أكتر حاجة هتعملها. اقراها بالراحة أول مرة."),

      Danger("🛑 اقرا ده قبل ما تبدأ", [
        [R("المنتج اللي مالوش ", { size: 22, color: INK }), R("سعر", { size: 22, bold: true, color: RED }), R(" ", { size: 22, color: INK }), R("مش هيظهر في الموقع خالص", { size: 22, bold: true, color: RED }), R(" — حتى لو حفظته وعملته «منشور».", { size: 22, color: INK })],
        [R("دي أشهر مشكلة: «أنا ضفت المنتج وبدوّر عليه مش لاقيه». السبب دايماً إنك نسيت السعر.", { size: 22, color: INK })],
      ]),
      Gap(200),

      H2("الخطوات"),
      Step([R("من اللوحة دوس ", { size: 22, color: INK }), RL("Catalog", { size: 20, bold: true, color: INK })]),
      Step([R("دوس زرار الإضافة — هتفتح صفحة كبيرة", { size: 22, color: INK })]),
      Step([R("املأ الخانات دي:", { size: 22, color: INK })]),
      Gap(80),
      Tbl(
        ["الخانة", "معناها", "مثال"],
        [
          [[RL("Product Name", { size: 20, bold: true, color: INK })], "اسم المنتج", "شاحن سريع 65 وات"],
          [[RL("Brand", { size: 20, color: INK })], "الماركة", "Anker"],
          [[RL("URL Slug", { size: 20, color: INK })], "اسمه في الرابط — إنجليزي وبشرطات", [RL("anker-charger-65w", { size: 19, color: GREY })]],
          [[RL("Category", { size: 20, color: INK })], "القسم", "إكسسوارات الموبايل"],
          [[RL("Description", { size: 20, color: INK })], "وصف المنتج", "كلام يشرح المنتج"],
        ],
        [2400, 3200, 3426]
      ),
      Gap(180),
      Step([R("انزل تحت لقسم اسمه ", { size: 22, color: INK }), RL("Variants", { size: 20, bold: true, color: INK }), R(" — ", { size: 22, color: INK }), R("ده أهم قسم", { size: 22, bold: true, color: RED })]),
      Gap(80),
      Tbl(
        ["الخانة", "معناها"],
        [
          [[RL("SKU Code", { size: 20, bold: true, color: INK })], "كود داخلي تعرف بيه المنتج — أي كود من عندك. إجباري."],
          [[RL("Regular Price", { size: 20, bold: true, color: INK })], "السعر بالجنيه — إجباري"],
          [[RL("Sale Price", { size: 20, color: INK })], "سعر التخفيض — سيبها فاضية لو مفيش تخفيض"],
          [[RL("Stock Qty", { size: 20, color: INK })], "عندك كام قطعة"],
          [[RL("Condition Grade", { size: 20, color: INK })], "حالة الجهاز — اختار من القائمة"],
        ],
        [2600, 6426]
      ),
      Gap(180),
      Danger("🛑 خانتين من غيرهم الحفظ هيترفض", [
        [R("١) ", { size: 22, bold: true, color: RED }), RL("SKU Code", { size: 20, bold: true, color: INK }), R(" — كود من عندك تعرف بيه المنتج، زي ", { size: 22, color: INK }), RL("LX-001", { size: 19, color: GREY }), R(". لو سبتها فاضية هتشوف:", { size: 22, color: INK })],
        [RL("Variant 1 — SKU is required", { size: 19, bold: true, color: RED })],
        [R("٢) ", { size: 22, bold: true, color: RED }), RL("Regular Price", { size: 20, bold: true, color: INK }), R(" — السعر بالجنيه. لو سبتها فاضية هتشوف:", { size: 22, color: INK })],
        [RL("Variant 1 — Price is required", { size: 19, bold: true, color: RED })],
        [R("ولو كتبت فيها صفر:", { size: 22, color: INK })],
        [RL("Variant 1 — Price must be greater than zero", { size: 19, bold: true, color: RED })],
      ]),
      Gap(200),
      Tip("ليه الموقع بيمنع سعر الصفر؟", [
        [R("قبل كده، لو سبت خانة السعر فاضية كان بيحفظ عادي ويحسبها ", { size: 22, color: INK }), R("صفر", { size: 22, bold: true, color: INK }), R(" — والمنتج يروح للبيع بصفر جنيه من غير ما حد ياخد باله. ", { size: 22, color: INK }), R("دلوقتي بقى بيرفض", { size: 22, bold: true, color: "0F766E" }), R(" بدل ما يسيبك تكتشفها من أول طلب.", { size: 22, color: INK })],
      ]),
      Gap(200),
      Note("الرسالة بتقول لك الخانة بالظبط", [
        [R("لو الحفظ اترفض، الرسالة الحمرا فوق بتسمّي ", { size: 22, bold: true, color: INK }), R("الخانة اللي فيها المشكلة", { size: 22, bold: true, color: INK }), R(" ورقم الصف — مش بتقول «فيه غلط» وخلاص. اقرأها وروح على الخانة دي.", { size: 22, color: INK })],
      ]),
      Gap(180),
      Step([R("اكتب الاسم والوصف بالعربي وبالإنجليزي (فيه تبويبين فوق)", { size: 22, color: INK })]),
      Step([R("احفظ", { size: 22, color: INK })]),
      Step([R("ارجع لقائمة المنتجات وافتح ", { size: 22, color: INK }), R("مفتاح النشر", { size: 22, bold: true, color: INK }), R(" — لونه هيبقى أخضر", { size: 22, color: INK })]),

      Gap(200),
      Tip("💡 المفتاح الأخضر ده معناه إيه؟", [
        [R("أخضر = المنتج ظاهر للزباين.  ", { size: 22, color: INK }), R("رمادي", { size: 22, bold: true, color: GREY }), R(" = محفوظ عندك بس مخفي.", { size: 22, color: INK })],
        [R("لو منتج خلص من عندك، ", { size: 22, color: INK }), R("اقفل المفتاح", { size: 22, bold: true, color: INK }), R(" — متحذفوش. كده لما يرجع تفتحه في ثانية.", { size: 22, color: INK })],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────
      H1("٦. الصور"),
      Tip("✅ اسحب الصورة وسيبها — وخلاص", [
        [R("في صفحة المنتج فيه مربع للصور. ", { size: 22, color: INK }), R("اسحب الصورة من على جهازك وسيبها جوّاه", { size: 22, bold: true, color: INK }), R("، أو دوس عليه واختار الملف.", { size: 22, color: INK })],
        [R("والموقع ", { size: 22, color: INK }), R("بيظبّط الصورة لوحده", { size: 22, bold: true, color: INK }), R(": بيخلّيها مربّعة ١٥٠٠×١٥٠٠، بيحطّ خلفية بيضا في الفاضي، وبيصغّر حجمها لأقل من ٥٠٠ كيلوبايت.", { size: 22, color: INK })],
        [R("يعني ", { size: 22, color: INK }), R("متتعبش نفسك في تظبيط المقاسات", { size: 22, bold: true, color: INK }), R(" — نزّل الصورة وارفعها زي ما هي.", { size: 22, color: INK })],
      ]),
      Gap(200),
      H2("إيه أحسن صورة ترفعها"),
      Body("الموقع بيظبّط أي صورة، بس كل ما الأصل يكون أحسن، النتيجة تطلع أحسن:"),
      Gap(80),
      Tbl(
        ["الحاجة", "الأحسن", "ليه"],
        [
          ["المقاس", "١٥٠٠ × ١٥٠٠ أو أكبر", "الموقع بيصغّر الكبيرة — بس مبيكبّرش الصغيرة"],
          ["أقل مقاس مفيد", "١٠٠٠ × ١٠٠٠", "أقل من كده بتطلع ضبابية"],
          ["الخلفية", "بيضا أو شفافة", "شكل أنضف مع باقي المنتجات"],
          ["النوع", "JPG · PNG · WebP · AVIF", "دول المقبولين"],
          ["الحجم قبل الرفع", "أقل من ٥ ميجا", "ده الحد الأقصى"],
          ["العدد للمنتج", "من ١ لـ ٦", "أول صورة هي الرئيسية"],
          ["في المرة الواحدة", "١٠ صور", "لو أكتر، ارفعها على دفعات"],
        ],
        [2100, 2900, 4026]
      ),
      Gap(200),
      Warn("لو ظهرت لك رسالة حمرا", [
        [R("الرسالة بتقول السبب. أشهر واحدة: ", { size: 22, color: INK }), R("جلستك انتهت", { size: 22, bold: true, color: AMBER }), R(" — اقفل الصفحة، ادخل بحسابك تاني، وارفع الصورة تاني.", { size: 22, color: INK })],
        [R("لو الرسالة بتقول إن نوع الملف مش مقبول، بصّ على جدول فوق واتأكد إن الملف صورة مش ", { size: 22, color: INK }), RL("PDF", { size: 20, color: INK }), R(" مثلاً.", { size: 22, color: INK })],
      ]),
      Gap(200),
      Warn("الكلام ده كله عن صور المنتجات بس", [
        [R("الصور الكبيرة اللي فوق في الصفحة الرئيسية (السلايدر) ", { size: 22, color: INK }), R("مش بتترفع من اللوحة", { size: 22, bold: true, color: AMBER }), R(" — دي صور مكتوبة جوّه الكود نفسه، ", { size: 22, color: INK }), R("ومفيش شاشة تتحكم فيها لسه", { size: 22, bold: true, color: INK }), R(".", { size: 22, color: INK })],
        [R("تغييرها محتاج تعديل في الكود ونشر نسخة جديدة من الموقع — يعني حاجة تتطلب من اللي بيشتغل على الكود، مش حاجة تعملها من اللوحة.", { size: 22, color: INK })],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────
      H1("٧. الأقسام — Categories"),
      Body("القسم هو المجموعة اللي بتحط فيها المنتجات المتشابهة — زي «إكسسوارات الموبايل»."),
      Body("الأقسام بتظهر في مكانين: الشريط اللي فوق في كل الصفحات، والمربعات الملوّنة في الصفحة الرئيسية."),

      H2("الخانات اللي هتلاقيها"),
      Tbl(
        ["الخانة", "معناها"],
        [
          [[RL("Name", { size: 20, bold: true, color: INK })], "اسم القسم — إجباري"],
          [[RL("Slug", { size: 20, color: INK })], "اسمه في الرابط — إنجليزي وبشرطات"],
          [[RL("Parent Category", { size: 20, color: INK })], "لو القسم ده جوّه قسم أكبر. سيبها فاضية لو رئيسي"],
          [[RL("Visible to customers", { size: 20, color: INK })], "يظهر للزباين ولا لأ"],
          [[RL("Show on home page", { size: 20, color: INK })], "يظهر في مربعات الصفحة الرئيسية"],
          [[RL("Order", { size: 20, color: INK })], "الترتيب — الرقم الأصغر بيظهر الأول"],
          [[RL("Icon", { size: 20, color: INK })], "الأيقونة — تختار من ٢٢ أيقونة"],
          [[RL("Colour", { size: 20, color: INK })], "لون المربع — ٨ ألوان"],
          [[RL("Short label", { size: 20, color: INK })], "اسم مختصر لو الأصلي طويل ومش بيظبط في المربع"],
        ],
        [2900, 6126]
      ),

      H2("الأيقونات الـ ٢٢"),
      Body("مكتوبة بالإنجليزي في القائمة. دي معانيها:"),
      Tbl(
        ["الأيقونة", "معناها", "الأيقونة", "معناها"],
        [
          [[RL("Smartphone", { size: 19, color: INK })], "موبايل", [RL("Keyboard", { size: 19, color: INK })], "كيبورد"],
          [[RL("Laptop", { size: 19, color: INK })], "لابتوب", [RL("Mouse", { size: 19, color: INK })], "ماوس"],
          [[RL("Tablet", { size: 19, color: INK })], "تابلت", [RL("Monitor", { size: 19, color: INK })], "شاشة"],
          [[RL("Gamepad2", { size: 19, color: INK })], "دراع ألعاب", [RL("Tv", { size: 19, color: INK })], "تليفزيون"],
          [[RL("Watch", { size: 19, color: INK })], "ساعة", [RL("Speaker", { size: 19, color: INK })], "سماعة كبيرة"],
          [[RL("Headphones", { size: 19, color: INK })], "سماعة راس", [RL("Lightbulb", { size: 19, color: INK })], "لمبة"],
          [[RL("Camera", { size: 19, color: INK })], "كاميرا", [RL("Wifi", { size: 19, color: INK })], "واي فاي"],
          [[RL("Cable", { size: 19, color: INK })], "كابل", [RL("Cpu", { size: 19, color: INK })], "معالج"],
          [[RL("BatteryCharging", { size: 19, color: INK })], "شاحن/بطارية", [RL("Car", { size: 19, color: INK })], "عربية"],
          [[RL("Home", { size: 19, color: INK })], "بيت", [RL("Plane", { size: 19, color: INK })], "طيارة/سفر"],
          [[RL("Package", { size: 19, color: INK })], "علبة", [RL("ShoppingBag", { size: 19, color: INK })], "شنطة تسوّق"],
        ],
        [2100, 2400, 2100, 2426]
      ),
      Gap(180),
      Tip("لو اخترت أيقونة والاسم مكتوب غلط", [
        [R("الموقع مش هيقع — هيحط أيقونة الشنطة ", { size: 22, color: INK }), RL("ShoppingBag", { size: 20, color: INK }), R(" مكانها. فلو لقيت شنطة في مكان متوقعتهاش، غالباً الاسم متكتب غلط.", { size: 22, color: INK })],
      ]),

      H2("الألوان الـ ٨"),
      Body("الأسماء إنجليزي لكنها مجرد أسماء ألوان — تقدر تستخدم أي لون لأي قسم:"),
      Tbl(
        ["الاسم", "الاسم", "الاسم", "الاسم"],
        [
          [[RL("smartphones", { size: 19, color: INK })], [RL("laptops", { size: 19, color: INK })], [RL("tablets", { size: 19, color: INK })], [RL("consoles", { size: 19, color: INK })]],
          [[RL("watches", { size: 19, color: INK })], [RL("audio", { size: 19, color: INK })], [RL("home", { size: 19, color: INK })], [RL("deals", { size: 19, color: INK })]],
        ],
        [2256, 2256, 2256, 2258]
      ),
      Gap(180),
      Tip("👁️ فيه معاينة حيّة", [
        [R("جنب الخانات فيه مربع اسمه ", { size: 22, color: INK }), RL("Preview", { size: 20, bold: true, color: INK }), R(" بيوريك شكل القسم وإنت بتغيّر — قبل ما تحفظ. جرّب فيه براحتك.", { size: 22, color: INK })],
      ]),
      Gap(160),
      Warn("متحذفش قسم — اخفيه", [
        [R("لو حذفت قسم، المنتجات اللي جواه بتفقد ارتباطها بيه. الأأمن إنك تقفل ", { size: 22, color: INK }), RL("Visible to customers", { size: 20, bold: true, color: INK }), R(".", { size: 22, color: INK })],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────
      H1("٨. شكل المتجر — Storefront Builder"),
      Body("من هنا بتتحكم في ألوان المتجر وترتيب الصفحة الرئيسية. ده أكتر قسم ممتع، وأكتر واحد كمان لازم تاخد بالك فيه."),

      H2("الألوان الأربعة"),
      Tbl(
        ["الخانة", "بتتحكم في إيه"],
        [
          [[RL("Primary", { size: 20, bold: true, color: INK })], "اللون الأساسي — الأزرار الرئيسية"],
          [[RL("Secondary", { size: 20, color: INK })], "اللون الثانوي — العناصر الأقل أهمية"],
          [[RL("Accent", { size: 20, color: INK })], "لون التمييز — التخفيضات والتنبيهات"],
          [[RL("Surface", { size: 20, color: INK })], "لون الخلفيات والكروت"],
        ],
        [2600, 6426]
      ),

      H2("استدارة الحواف — Radius"),
      Body("بتغيّر شكل الأزرار والكروت من حواف حادة لدايرية:"),
      Tbl(
        ["الاختيار", "الشكل"],
        [
          [[RL("Sharp", { size: 20, color: INK })], "حواف حادة تماماً — شكل جاد"],
          [[RL("Small", { size: 20, color: INK })], "استدارة خفيفة جداً"],
          [[RL("Default", { size: 20, bold: true, color: INK })], "الوضع الحالي — متوازن"],
          [[RL("Large", { size: 20, color: INK })], "استدارة واضحة"],
          [[RL("Pill", { size: 20, color: INK })], "بيضاوي بالكامل زي الحبّاية"],
        ],
        [2400, 6626]
      ),

      H2("ترتيب الصفحة الرئيسية"),
      Body("الصفحة الرئيسية متقسّمة سبع أجزاء. تقدر ترتّبهم وتخفي اللي مش عايزه:"),
      Tbl(
        ["الجزء", "هو إيه"],
        [
          [[RL("hero", { size: 20, bold: true, color: INK })], "السلايدر الكبير اللي فوق خالص"],
          [[RL("categories", { size: 20, color: INK })], "مربعات الأقسام الملوّنة"],
          [[RL("featured", { size: 20, color: INK })], "منتجات مختارة"],
          [[RL("bestsellers", { size: 20, color: INK })], "الأكثر مبيعاً"],
          [[RL("brands", { size: 20, color: INK })], "شريط الماركات"],
          [[RL("newsletter", { size: 20, color: INK })], "خانة الاشتراك بالبريد"],
          [[RL("trust", { size: 20, color: INK })], "شريط الضمانات (ضمان، إرجاع، شحن)"],
        ],
        [2200, 6826]
      ),
      Gap(200),
      Danger("🛑 غيّر حاجة واحدة في المرة", [
        [R("الألوان مرتبطة ببعضها. لو غيّرت أربع ألوان مرة واحدة وطلع الشكل وحش، ", { size: 22, color: INK }), R("مش هتعرف مين السبب", { size: 22, bold: true, color: RED }), R(".", { size: 22, color: INK })],
        [R("الطريقة الصح: غيّر لون واحد ← بص على المعاينة ← احفظ ← افتح الموقع وشوفه ← وبعدين اللي بعده.", { size: 22, color: INK })],
      ]),
      Gap(160),
      Tip("التغيير مبيحصلش غير لما تدوس Save", [
        [R("فيه زرار ", { size: 22, color: INK }), RL("Save Changes", { size: 20, bold: true, color: INK }), R(" — من غيره اللي عملته مش هيتطبّق. ولو مخافتش من حاجة، اقفل الصفحة من غير حفظ وكل حاجة هترجع زي ما كانت.", { size: 22, color: INK })],
      ]),

      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────
      H1("٩. لو حصلت مشكلة"),
      Body("الجدول ده فيه أشهر المشاكل. دوّر على مشكلتك واعمل اللي مكتوب."),
      Tbl(
        ["المشكلة", "الحل"],
        [
          ["ضفت منتج ومش لاقيه في الموقع", "افتحه وشوف فيه سعر ولا لأ. غالباً دي المشكلة."],
          ["المنتج محفوظ بس مش ظاهر", "مفتاح النشر مقفول — افتحه"],
          ["الحفظ اترفض وظهرت رسالة حمرا", "الرسالة بتسمّي الخانة والصف — غالباً SKU أو السعر"],
          ["الصورة مش بترفع وبتظهر رسالة", "غالباً جلستك انتهت — ادخل بحسابك تاني وجرّب"],
          ["عدّلت حاجة ومش ظاهرة في الموقع", "استنى شوية، الموقع بيحدّث نفسه كل ساعة"],
          ["الأرقام في أول صفحة غريبة", "دي أرقام تجريبية — شوف Orders"],
          ["مش عارف أدخل", "اضغط «نسيت كلمة المرور؟» — هييجي لك إيميل فيه لينك"],
          ["القسم مش ظاهر في الصفحة الرئيسية", "افتح Show on home page، وشوف رقم Order"],
          ["مربع القسم طالع بأيقونة شنطة", "اسم الأيقونة متكتب غلط — اختار من القائمة تاني"],
          ["غيّرت الألوان ومفيش حاجة اتغيّرت", "نسيت تدوس Save Changes"],
          ["الشكل بقى وحش بعد تغيير الألوان", "رجّعهم واحد واحد لحد ما تعرف مين السبب"],
        ],
        [3400, 5626]
      ),

      // ─────────────────────────────────────
      H1("١٠. حاجات المتجر مبيعملهاش"),
      Body("عشان متتعبش نفسك وتدوّر عليها:"),
      Bullet([R("مفيش صفحة «عملاء» — بيانات العميل بتلاقيها جوّه الطلب نفسه", { size: 22, color: INK })]),
      Bullet([R("الدفع عند الاستلام بس — مفيش دفع بالفيزا", { size: 22, color: INK })]),
      Bullet([R("المخزون مبيقلّش لوحده بعد الطلب — بتعدّله بإيدك", { size: 22, color: INK })]),
      Bullet([R("مفيش رسايل بتروح للعميل لوحدها لما تغيّر مرحلة الطلب", { size: 22, color: INK })]),
      Bullet([R("مفيش تقارير أو تصدير إكسل", { size: 22, color: INK })]),
      Bullet([R("العميل مش بيقدر يعمل حساب — بيشتري كضيف باسمه وتليفونه", { size: 22, color: INK })]),
      Bullet([R("صور السلايدر الكبير مش بتتغيّر من اللوحة — دي في الكود", { size: 22, color: INK })]),
      Bullet([R("مش تقدر تضيف أيقونة أو لون جديد للأقسام — الاختيارات ثابتة (٢٢ أيقونة و٨ ألوان)", { size: 22, color: INK })]),

      Gap(400),
      P([R("خلاص، كده تقدر تشتغل 👍", { size: 24, bold: true, color: MINT })], { alignment: AlignmentType.CENTER, spacing:{after:120} }),
      P([R("لو لقيت الشاشة مختلفة عن الدليل، الشاشة هي الصح — الدليل ده اتكتب في ٤ أغسطس ٢٠٢٦.", { size: 20, color: GREY })], { alignment: AlignmentType.CENTER }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = process.argv[2] || "LevelX-Admin-Guide-Simple.docx";
  fs.writeFileSync(out, buf);
  console.log("written:", out, (buf.length / 1024).toFixed(1) + " KB");
});
