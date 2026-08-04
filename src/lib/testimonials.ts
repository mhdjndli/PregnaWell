export const testimonialCategories = [
  { id: "pregnancy", label: "الحمل بعد البرنامج" },
  { id: "wellness", label: "التحسّن الهرموني والنفسي" },
  { id: "health", label: "التحاليل والسكر والتحسّن الصحي" },
  { id: "nutrition", label: "تغييرات في العادات الغذائية" },
  { id: "postpartum", label: "بعد الولادة والمتابعة المستمرة" },
] as const;

export type TestimonialCategoryId = (typeof testimonialCategories)[number]["id"];

export type StoryTestimonial = {
  slug: string;
  headline: string;
  quote: string;
  images: string[];
  categories: TestimonialCategoryId[];
};

export const featuredStory = {
  headline: "سارة - الخبر الذي غيّر حياتها 💕",
  intro: '"حبيت أنطيكم خبر حلو 🥰😊"',
  body:
    "بهذه الجملة بدأت سارة رسالتها لنا، مرفقةً بصورة اختبار الحمل الإيجابي. بعد أشهر من الالتزام بخطة ديتوكس الخصوبة، تحقّق الحلم الذي انتظرته طويلاً.",
  image: "/testimonials/hero/sarah-pregnancy-test.jpg",
};

type LocalizedString = { en: string; ar: string };

export type VideoTestimonial = {
  slug: string;
  youtubeId: string;
  flag: string;
  headline: LocalizedString;
  country: LocalizedString;
  quote: LocalizedString;
  body: LocalizedString;
};

export const videoTestimonials: readonly VideoTestimonial[] = [
  {
    slug: "fathia",
    youtubeId: "-Fi4QdQEZnw",
    flag: "🇸🇦",
    headline: { en: "Fathiya's Story", ar: "قصة فتحية" },
    country: { en: "Saudi Arabia", ar: "السعودية" },
    quote: {
      en: "“Even if it wasn't meant to be, I still won my health back… and that's a huge win.”",
      ar: '"حتى لو ما كُتب لي، أنا ربحت صحتي… ومكسب عظيم."',
    },
    body: {
      en: "After repeated miscarriages and normal test results, Fathiya started from the ground up. She lost 10 kg without the exhausting effort everything else had cost her, and now knows exactly what to eat and what to avoid.",
      ar: "بعد إجهاضات متكرّرة وتحاليل سليمة، بدأت فتحية من الأساس. نزلت ١٠ كيلو دون الجهد الذي أنهكها في كل ما جرّبته قبلها، وصارت تعرف ماذا تأكل وماذا تتجنّب.",
    },
  },
  {
    slug: "raghad",
    youtubeId: "ETMiyJqC1g8",
    flag: "🇶🇦",
    headline: { en: "Raghad's Story", ar: "قصة رغد" },
    country: { en: "Qatar", ar: "قطر" },
    quote: {
      en: "“How I see food, weight, and health changed completely.”",
      ar: '"تغيّرت نظرتي للأكل وللوزن وللصحة بشكل جذري."',
    },
    body: {
      en: "From PCOS and a weight struggle that followed her since childhood… to a positive pregnancy test. Raghad says what changed wasn't the number on the scale. Today she's become her own family's go-to on nutrition.",
      ar: "من تكيّس المبايض ومشكلة وزن رافقتها من الطفولة… إلى خبر الحمل. تقول رغد إن ما تغيّر لم يكن الرقم. واليوم صارت هي المرجع الغذائي لعائلتها.",
    },
  },
  {
    slug: "toulay",
    youtubeId: "qoS8usZhf-8",
    flag: "🇺🇸",
    headline: { en: "Tulay's Story", ar: "قصة تولاي" },
    country: { en: "United States", ar: "أمريكا" },
    quote: {
      en: "“I had absolute certainty I was going to be a mother.”",
      ar: '"كان عندي يقين مطلق إني حأكون أم."',
    },
    body: {
      en: "After her first IVF cycle failed, no one had ever talked to her about nutrition. Tulay started just two months before her second attempt — going from 19 supplements and herbs down to four, with her labs improving. The procedure succeeded when she was 37; her daughter is now a year old. When you're ready, nothing can stop you.",
      ar: "بعد فشل أول عملية حقن مجهري، لم يكلّمها أحد عن غذائها. بدأت تولاي قبل شهرين فقط من المحاولة الثانية… من ١٩ مكمّلاً وعشبة إلى أربعة، وتحاليل تحسّنت. نجحت العملية وهي في الـ٣٧، وبنتها اليوم عمرها سنة. لما بتكوني جاهزة، ما في شي بوقف.",
    },
  },
  {
    slug: "nadine",
    youtubeId: "CZpXsY8WlXE",
    flag: "🇦🇪",
    headline: { en: "Nadine's Story", ar: "قصة نادين" },
    country: { en: "UAE", ar: "الإمارات" },
    quote: {
      en: "“My body became something sacred to me.”",
      ar: '"صار جسمي بالنسبة لي شيء مقدّس."',
    },
    body: {
      en: "“I was going through failure — no natural pregnancy, not even with IVF.” Nadine is a structured person, and what convinced her was understanding the reason behind every step instead of just following it blindly. After four months she lost over 8 kg and her labs improved.",
      ar: "\"كنت عم بمرّ بفشل - لا حمل طبيعي ولا حتى مع الـIVF.\" نادين إنسانة منظّمة، وما أقنعها أنها فهمت السبب خلف كل خطوة بدل أن تتبعها على العماية. بعد أربعة أشهر نزلت أكثر من ٨ كيلو، وتحسّنت تحاليلها.",
    },
  },
  {
    slug: "abeer",
    youtubeId: "gK_gylLOmsI",
    flag: "🇦🇪",
    headline: { en: "Abeer's Story", ar: "قصة عبير" },
    country: { en: "UAE", ar: "الإمارات" },
    quote: {
      en: "“Past 35, everything gets harder… I was honestly lost.”",
      ar: '"في عمر فوق الـ٣٥ بصير كل شيء أصعب… كنت ضايعة بصراحة."',
    },
    body: {
      en: "Abeer didn't need a stricter system, she needed one that actually fit her. She learned how to structure her eating and change her habits, and the weight she couldn't shift for years finally moved. Today she's the one giving others advice.",
      ar: "لم تحتج عبير إلى نظام أقسى، بل إلى نظام يناسبها. تعلّمت كيف تنظّم أكلها وتغيّر عاداتها، ونزل الوزن الذي عجزت عن تحريكه سنوات… واليوم صارت هي من تنصح غيرها.",
    },
  },
  {
    slug: "rola",
    youtubeId: "gb1ZTAmlEVE",
    flag: "🇸🇦",
    headline: { en: "Rola's Story", ar: "قصة رولا" },
    country: { en: "Saudi Arabia", ar: "السعودية" },
    quote: {
      en: "“Seven years since I got married… and every doctor kept saying: everything's fine, just pray.”",
      ar: '"سبع سنين من أول ما تزوّجت… وكل دكتور يقول: الأمور تمام، بس ادعوا."',
    },
    body: {
      en: "What Rola was missing wasn't a plan, it was understanding. “What was this diet actually based on?” — a question she'd never gotten an answer to before. Today she reads the ingredients in everything she buys and explains them to her family.",
      ar: "ما نقص رولا لم يكن خطّة، بل فهمًا. \"بناءً على شو أعطيتوني النظام الغذائي؟\" - سؤال لم تجد له جوابًا من قبل. اليوم تقرأ مكوّنات كل ما تشتريه، وتشرحه لأهلها.",
    },
  },
];

export const storyTestimonials: StoryTestimonial[] = [
  {
    slug: "asmaa",
    headline: "أسماء - حمل بعد عناء 🤍",
    quote: '"الحمد لله أنا حامل بعد ٣ تجارب حقن مجهري فاشلة."',
    images: ["/testimonials/stories/4-01-asmaa.png"],
    categories: ["pregnancy"],
  },
  {
    slug: "alanoud",
    headline: "العنود - من الانتظار إلى نبض الحياة 🌸",
    quote:
      'بدأت العنود معنا بخطة دعم الخصوبة، وبعد أسابيع أرسلت تقول: "الحمد لله أنا حامل." ثم تابعت: "سمعت نبض البيبي اليوم، الحمد لله." رحلة صبرٍ انتهت بأجمل صوت.',
    images: [
      "/testimonials/stories/4-2-Alanoud-1.jpg",
      "/testimonials/stories/4-2-Alanoud-2.jpg",
    ],
    categories: ["pregnancy"],
  },
  {
    slug: "hala",
    headline: "هلا - عندما تحقّق الدعاء 🌷",
    quote:
      '"دكتورة أنا حامل من فضل الله، هلأ عندي مراجعة ليشوفوا إذا التوأم انغرس أو واحد، دعواتك." رسالة مؤثرة تفيض بالامتنان والفرح.',
    images: ["/testimonials/stories/4-03-hala.jpg"],
    categories: ["pregnancy"],
  },
  {
    slug: "salam-diabetes",
    headline: "سلام - من سكري الحمل إلى السيطرة الكاملة 💪",
    quote:
      '"صار معي سكري بالحملين السابقين، بس لأول مرة بحسّ أني مسيطرة على جسمي وصحتي." "تحسّنت علاقتي بجسمي وصرت متصالحة أكثر."',
    images: ["/testimonials/stories/4-04-salam.jpg"],
    categories: ["health", "wellness"],
  },
  {
    slug: "sarah-sugar",
    headline: "سارة - من الخوف من السكري إلى الطمأنينة 🌸",
    quote:
      '"تحليل السكر نزل من 5.7 إلى 5.5." "صرت أطبخ وأتسوّق بطريقة صحية واستعدت ثقتي بنفسي."',
    images: ["/testimonials/stories/4-05-sarah-sugar.jpg"],
    categories: ["health", "nutrition"],
  },
  {
    slug: "lina",
    headline: "لينا - نتائج ملموسة رغم السفر 🌼",
    quote: '"بعد الغداء السكر ١٢٦ 👏❤️ وبعدها نزل الوزن ٤ باوند رغم السفر."',
    images: [
      "/testimonials/stories/4-06-lina-1.jpg",
      "/testimonials/stories/4-06-lina-2.jpg",
    ],
    categories: ["health", "nutrition"],
  },
  {
    slug: "farah",
    headline: "فرح - بنوّتها الصغيرة وصلت إلى الدنيا 👶",
    quote: '"أجت بنوّته كتكوتة الحمد لله." رسالة قصيرة تختصر فرحة أمّ بعد رحلة خصوبة ناجحة.',
    images: ["/testimonials/stories/4-07-farah.jpg"],
    categories: ["postpartum", "pregnancy"],
  },
  {
    slug: "aseel",
    headline: "أسيل - حمل جديد بعد الولادة 🌸",
    quote: '"بعد ما نزل البيبي الأول بشهر فقط، حملت من جديد."',
    images: ["/testimonials/stories/4-08-aseel.jpg"],
    categories: ["postpartum", "pregnancy"],
  },
  {
    slug: "shahad",
    headline: "شهد - بنوّتها الصغيرة وصلت 💕",
    quote: '"ولدت من أسبوع، جبت أحلى بنوتة."',
    images: ["/testimonials/stories/4-09-shahad.jpg"],
    categories: ["postpartum"],
  },
  {
    slug: "maram",
    headline: "مرام - بعد الولادة بأيام قليلة 💖",
    quote:
      '"أموري تمام، ومن أربع أيام ولدت الحمد لله." رسالة هادئة تعبّر عن سلام ما بعد الولادة.',
    images: ["/testimonials/stories/4-10-maram.jpg"],
    categories: ["postpartum"],
  },
  {
    slug: "sarah-postpartum",
    headline: "سارة - متابعة بعد الولادة 🤍",
    quote: '"أنا بخير والحمد لله، شكراً من القلب."',
    images: [
      "/testimonials/stories/4-11-sarah-postpartum-1.jpg",
      "/testimonials/stories/4-11-sarah-postpartum-2.webp",
    ],
    categories: ["postpartum"],
  },
  {
    slug: "widad",
    headline: "وداد - راحة نفسية قبل أي نتيجة 🌿",
    quote:
      '"جداً سعدت بالبرنامج واستفدت أكثر مما توقعت." رسالة تعبّر عن شعور السلام والامتنان.',
    images: ["/testimonials/stories/4-12-widad.jpg"],
    categories: ["wellness"],
  },
  {
    slug: "raghad",
    headline: "رغد - أخيرًا وجدت التوازن 🍃",
    quote: '"أخيراً لقيت الشي اللي يتناسب مع جسمي وأسلوب حياتي."',
    images: ["/testimonials/stories/4-13-raghad.jpg"],
    categories: ["wellness"],
  },
  {
    slug: "intisar-flexibility",
    headline: "انتصار - التغيير السهل والمستمر 🌸",
    quote: '"جداً مبسوطة إن فيه مرونة بالبرنامج، ما حاسة بضغوط نفسي."',
    images: ["/testimonials/stories/4-14-intisar-flexibility.png"],
    categories: ["wellness"],
  },
  {
    slug: "makkiya",
    headline: "مكية - ٦.٦ كغ منذ بداية البرنامج ⚖️",
    quote: '"نزلت ٦.٦ كيلو من بداية البرنامج."',
    images: ["/testimonials/stories/4-15-makkiya.png"],
    categories: ["nutrition"],
  },
  {
    slug: "salam-weight",
    headline: "سلام - نزول ٢.٦ كغ في ٣ أسابيع ⚖️",
    quote: '"I’m proud of myself 😎" رسالة قصيرة وصلتنا بعد ثلاثة أسابيع من بداية البرنامج.',
    images: ["/testimonials/stories/4-16-salam-weight.jpg"],
    categories: ["nutrition"],
  },
  {
    slug: "aziza",
    headline: "عزيزة - نظام غذائي لها ولزوجها 🍽️",
    quote:
      '"أنا لما بلشت في النظام كان وزني ٧٠ وبعد شهر صار ٦٧، وزوجي كان ٧٤ وصار ٧٠."',
    images: ["/testimonials/stories/4-17-aziza.png"],
    categories: ["nutrition"],
  },
  {
    slug: "intisar-fruit",
    headline: "انتصار - من التجاهل إلى الوعي 🍎",
    quote: '"كنت شهور ما آكل فواكه، واليوم صرت أفرح بكل حصة فاكهة."',
    images: ["/testimonials/stories/4-18-intisar-fruit.jpg"],
    categories: ["nutrition"],
  },
  {
    slug: "lana",
    headline: "لانا - الحماس يعود إلى المطبخ 🧁",
    quote: '"الوصفات بتجنن، صرت متحمسة أطبّق النظام أكثر."',
    images: ["/testimonials/stories/4-19-lana.jpg"],
    categories: ["nutrition"],
  },
  {
    slug: "safiya",
    headline: "صفية - كلمات من القلب 💌",
    quote: '"ما أعرف كيف أشكرك، الله يسعدك ويرضى عنك."',
    images: ["/testimonials/stories/4-20-safiya.jpg"],
    categories: ["wellness"],
  },
  {
    slug: "iman",
    headline: "إيمان - دعاء من أم 🤲",
    quote: '"بارك الله في علمك وجعله شافعًا ورافعًا لك يوم القيامة."',
    images: ["/testimonials/stories/4-21-iman.png"],
    categories: ["wellness"],
  },
];

export const socialStats = [
  { label: "Instagram", value: "460,000", suffix: "متابِعة" },
  { label: "TikTok", value: "335,000", suffix: "متابِعة" },
  { label: "YouTube", value: "17,000", suffix: "مشترِك" },
  { label: "Facebook", value: "255,000", suffix: "متابِعة" },
];
