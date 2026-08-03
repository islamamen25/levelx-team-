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
          [[RL("SKU Code", { size: 20, bold: true, color: INK })], "كود داخلي تعرف بيه المنتج — أي كود من عندك"],
          [[RL("Regular Price", { size: 20, bold: true, color: INK })], "السعر بالجنيه — إجباري"],
          [[RL("Sale Price", { size: 20, color: INK })], "سعر التخفيض — سيبها فاضية لو مفيش تخفيض"],
          [[RL("Stock Qty", { size: 20, color: INK })], "عندك كام قطعة"],
          [[RL("Condition Grade", { size: 20, color: INK })], "حالة الجهاز — اختار من القائمة"],
        ],
        [2600, 6426]
      ),
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
      Danger("🛑 مش هتقدر ترفع صور من اللوحة", [
        [R("فيه مربع لرفع الصور، بس لو جربته هيديك رسالة خطأ. ", { size: 22, color: INK }), R("ده مش عطل", { size: 22, bold: true, color: RED }), R(" — الصور بترفع بطريقة تانية عن طريق المسؤول التقني.", { size: 22, color: INK })],
        [R("اللي عليك: جهّز الصور بالمواصفات اللي تحت وابعتها له.", { size: 22, color: INK })],
      ]),
      Gap(200),
      H2("الصورة المطلوبة"),
      Tbl(
        ["الحاجة", "المطلوب", "ليه"],
        [
          ["الشكل", "مربّعة", "مكان الصورة في الموقع مربّع"],
          ["المقاس", "١٥٠٠ × ١٥٠٠", "أوضح مقاس"],
          ["أقل مقاس", "١٠٠٠ × ١٠٠٠", "أقل من كده بتبقى ضبابية"],
          ["الحجم", "أقل من ٥٠٠ كيلوبايت", "عشان الصفحة تفتح بسرعة"],
          ["النوع", "JPG أو WebP", "دول اللي الموقع بيقراهم"],
          ["الخلفية", "بيضاء", "شكل أنضف"],
          ["العدد", "من ١ لـ ٦", "أول صورة هي الرئيسية"],
        ],
        [2100, 2900, 4026]
      ),

      // ─────────────────────────────────────
      H1("٧. لو حصلت مشكلة"),
      Body("الجدول ده فيه أشهر المشاكل. دوّر على مشكلتك واعمل اللي مكتوب."),
      Tbl(
        ["المشكلة", "الحل"],
        [
          ["ضفت منتج ومش لاقيه في الموقع", "افتحه وشوف فيه سعر ولا لأ. غالباً دي المشكلة."],
          ["المنتج محفوظ بس مش ظاهر", "مفتاح النشر مقفول — افتحه"],
          ["رفع الصورة بيدي خطأ", "طبيعي — ابعت الصور للمسؤول التقني"],
          ["عدّلت حاجة ومش ظاهرة في الموقع", "استنى شوية، الموقع بيحدّث نفسه كل ساعة"],
          ["الأرقام في أول صفحة غريبة", "دي أرقام تجريبية — شوف Orders"],
          ["مش عارف أدخل", "اضغط «نسيت كلمة المرور؟» أو كلّم المسؤول التقني"],
        ],
        [3400, 5626]
      ),

      // ─────────────────────────────────────
      H1("٨. حاجات المتجر مبيعملهاش"),
      Body("عشان متتعبش نفسك وتدوّر عليها:"),
      Bullet([R("مفيش صفحة «عملاء» — بيانات العميل بتلاقيها جوّه الطلب نفسه", { size: 22, color: INK })]),
      Bullet([R("الدفع عند الاستلام بس — مفيش دفع بالفيزا", { size: 22, color: INK })]),
      Bullet([R("المخزون مبيقلّش لوحده بعد الطلب — بتعدّله بإيدك", { size: 22, color: INK })]),
      Bullet([R("مفيش رسايل بتروح للعميل لوحدها لما تغيّر مرحلة الطلب", { size: 22, color: INK })]),
      Bullet([R("مفيش تقارير أو تصدير إكسل", { size: 22, color: INK })]),
      Bullet([R("العميل مش بيقدر يعمل حساب — بيشتري كضيف باسمه وتليفونه", { size: 22, color: INK })]),

      Gap(400),
      P([R("خلاص، كده تقدر تشتغل 👍", { size: 24, bold: true, color: MINT })], { alignment: AlignmentType.CENTER, spacing:{after:120} }),
      P([R("لو لقيت الشاشة مختلفة عن الدليل، الشاشة هي الصح — بلّغ المسؤول التقني.", { size: 20, color: GREY })], { alignment: AlignmentType.CENTER }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = process.argv[2] || "LevelX-Admin-Guide-Simple.docx";
  fs.writeFileSync(out, buf);
  console.log("written:", out, (buf.length / 1024).toFixed(1) + " KB");
});
