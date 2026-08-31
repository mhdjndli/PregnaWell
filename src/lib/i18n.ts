export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "ar" : "en";
}

// =============================================================================
// Categories
// =============================================================================

export const categories = [
  { id: "before", en: "Before Pregnancy", ar: "قبل الحمل" },
  { id: "during", en: "During Pregnancy", ar: "خلال الحمل" },
  { id: "after", en: "After Pregnancy", ar: "بعد الحمل" },
] as const;

export type CategoryId = (typeof categories)[number]["id"];

export function isCategoryId(value: unknown): value is CategoryId {
  return (
    typeof value === "string" &&
    categories.some((c) => c.id === value)
  );
}

export function categoryLabel(id: string | null | undefined, locale: Locale): string | null {
  if (!id) return null;
  const c = categories.find((x) => x.id === id);
  if (!c) return id;
  return locale === "ar" ? c.ar : c.en;
}

// =============================================================================
// Strings
// =============================================================================

type Dict = {
  nav: { home: string; story: string; blog: string; testimonials: string };
  cta: {
    masterclass: string;
    masterclassShort: string;
    fertilityScore: string;
    watchNow: string;
    readArticle: string;
    inquireWhatsapp: string;
    browseCourses: string;
    browseLibrary: string;
    messageWhatsapp: string;
    chat: string;
    readMyStory: string;
  };
  hero: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    titleTrail: string;
    subtitle: string;
    free: string;
    quote: string;
    quoteAttribution: string;
  };
  stats: { videoViews: string; mothersSupported: string; instagramFollowers: string };
  press: { eyebrow: string };
  why: { eyebrow: string; title: string; subtitle: string };
  programs: {
    eyebrow: string;
    title: string;
    subtitle: string;
    freeEyebrow: string;
    freeTitle: string;
    paid: Record<
      "fertilityDetox" | "greenPlacenta" | "soukkara",
      { badge: string; subtitle?: string; title: string; description: string; features: string[]; cta: string }
    >;
    free: Record<
      "podcast" | "youtube" | "masterclass" | "articles",
      { badge: string; title: string; description: string; features: string[]; cta: string }
    >;
  };
  testimonials: { eyebrow: string; title: string; items: { quote: string; name: string; role: string }[] };
  faq: {
    eyebrow: string;
    title: string;
    helper: string;
    contact: string;
    items: { q: string; a: string; link?: { text: string; href: string } }[];
  };
  founder: {
    eyebrow: string;
    title: string;
    body: string;
    masterclass: string;
  };
  footer: {
    explore: string;
    follow: string;
    tagline: string;
    rights: string;
    closing: string;
  };
  story: {
    eyebrow: string;
    title: string;
    intro: string;
    body: string; // markdown
    ctas: {
      startHere: { eyebrow: string; title: string; body: string };
      orAssess: { eyebrow: string; title: string; body: string };
    };
  };
  blog: {
    eyebrow: string;
    title: string;
    subtitle: string;
    empty: { title: string; body: string };
    minRead: string;
    backAll: string;
    by: string;
    filters: { all: string };
    keepGoing: { eyebrow: string; title: string; body: string };
    assess: { eyebrow: string; title: string; body: string };
  };
  language: { en: string; ar: string; switchLabel: string };
};

const en: Dict = {
  nav: { home: "Home", story: "Story", blog: "Articles", testimonials: "Testimonials" },
  cta: {
    masterclass: "Watch a Free Masterclass",
    masterclassShort: "Watch the Free Masterclass",
    fertilityScore: "Check Your Fertility Score",
    watchNow: "Watch now",
    readArticle: "Read article",
    inquireWhatsapp: "Inquire on WhatsApp",
    browseCourses: "Browse courses",
    browseLibrary: "Browse the library",
    messageWhatsapp: "Message us on WhatsApp →",
    chat: "Chat",
    readMyStory: "Read my story",
  },
  hero: {
    eyebrow: "PregnaWell · with Maha Hommos",
    titleLead: "Empowering women on their journey to ",
    titleAccent: "motherhood",
    titleTrail: ".",
    subtitle:
      "From fertility to postpartum, our expert-led programs and resources are here to guide you with science, compassion, and real-world wisdom, every step of the way.",
    free: "Free 60-minute masterclass on the HPO axis · No credit card required",
    quote: "“Science-backed care, delivered with warmth.”",
    quoteAttribution: "Maha Hommos, Founder",
  },
  stats: {
    videoViews: "Video views",
    mothersSupported: "Mothers supported",
    instagramFollowers: "Instagram followers",
  },
  press: { eyebrow: "As Appeared On" },
  why: {
    eyebrow: "Why PregnaWell",
    title: "Compassionate, evidence-based care for every mom-to-be.",
    subtitle:
      "Maha Hommos blends clinical nutrition expertise with a decade of helping women understand their bodies, hormones, and choices, building the tools you actually need.",
  },
  programs: {
    eyebrow: "Programs & Services",
    title: "Expert-led programs for every stage of your journey.",
    subtitle:
      "Whether you're preparing to conceive, already expecting, or managing gestational diabetes, there's a program built for exactly where you are.",
    freeEyebrow: "Free to start",
    freeTitle: "Start learning before you spend anything.",
    paid: {
      fertilityDetox: {
        badge: "Pregnancy Prep Program",
        subtitle: "3 months",
        title: "Fertility Detox",
        description:
          "Our flagship program for women preparing to conceive. Three structured months of work on your fertility, guided by specialists and doctors, with support every single day.",
        features: [
          "Complete fertility course taught by specialists and doctors",
          "Daily live calls, plus one-on-one consultations",
          "Personalized fertility nutrition plan",
          "Vitamin and supplement guide",
          "Tracker app and partner access",
        ],
        cta: "Inquire on WhatsApp →",
      },
      greenPlacenta: {
        badge: "Full Pregnancy",
        title: "Green Placenta",
        description:
          "The same close daily guidance as Fertility Detox, built for women who are already pregnant. Nutrition and support from your first trimester through delivery, without the course component.",
        features: [
          "Personalized nutrition plan for every trimester",
          "Daily live calls, plus one-on-one consultations",
          "Vitamin and supplement guide for pregnancy",
          "Tracker app and partner access",
          "Daily support from first trimester to delivery",
        ],
        cta: "Inquire on WhatsApp →",
      },
      soukkara: {
        badge: "Full Pregnancy",
        title: "Soukkara",
        description:
          "For pregnant women managing gestational diabetes. A dedicated course on the condition, plus everything in our pregnancy program: daily calls, one-on-one consultations, and a nutrition plan built around your own glucose readings.",
        features: [
          "Dedicated gestational diabetes course",
          "Nutrition plan built around your glucose readings",
          "Daily live calls, plus one-on-one consultations",
          "Vitamin and supplement guide",
          "Tracker app and partner access",
        ],
        cta: "Inquire on WhatsApp →",
      },
    },
    free: {
      podcast: {
        badge: "Podcast",
        title: "Hamel Talk Podcast",
        description:
          "Maha's long-form conversations with doctors and specialists, covering the pregnancy journey from the medical side to the emotional one. Real stories, told properly.",
        features: [
          "Full episodes, free on YouTube",
          "A guest expert in every episode",
          "Fertility, pregnancy, and everything around them",
        ],
        cta: "Listen to the podcast →",
      },
      youtube: {
        badge: "YouTube",
        title: "Long-Form Fertility Videos",
        description:
          "Full-length episodes where Maha takes one fertility topic and works through it properly, at a depth no short-form video can reach.",
        features: [
          "In-depth videos on fertility, hormones, and nutrition",
          "Free, no signup, watch any time",
          "Full library on the channel",
        ],
        cta: "Watch on YouTube ↗",
      },
      masterclass: {
        badge: "Free Masterclass",
        title: "The HPO Axis Masterclass",
        description:
          "A free 60-minute class on the hormone axis that governs your cycle and your fertility. The best place to start if you want to understand what your body is actually doing.",
        features: [
          "60 minutes, on demand",
          "No credit card required",
          "Book a free evaluation call at the end",
        ],
        cta: "Watch now →",
      },
      articles: {
        badge: "Articles",
        title: "The Article Library",
        description:
          "Written guides on fertility, hormones, pregnancy nutrition, and gestational diabetes. Evidence-based, and written to be read by someone who isn't a clinician.",
        features: [
          "Fertility and hormone health",
          "Pregnancy and gestational diabetes nutrition",
          "Free to read, no signup",
        ],
        cta: "Read the articles →",
      },
    },
  },
  testimonials: {
    eyebrow: "What moms say",
    title: "Loved by women on every stage of the journey.",
    items: [
      {
        quote: "PregnaWell's tips on managing gestational diabetes were life-changing!",
        name: "Sarah",
        role: "Mom of 2",
      },
      {
        quote: "I loved the Green Placenta Program, it helped me recover so much faster!",
        name: "Amanda",
        role: "New Mom",
      },
      {
        quote:
          "As a first-time mom, I had so many questions. PregnaWell's resources made everything feel manageable and even enjoyable!",
        name: "Layla",
        role: "New Mom",
      },
      {
        quote:
          "Their holistic approach to postpartum recovery helped me regain my strength and confidence faster than I ever imagined.",
        name: "Maya",
        role: "Mom of Twins",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    title: "Common questions, answered.",
    helper: "Don't see your question? Reach out on WhatsApp and we'll get back to you personally.",
    contact: "Message us on WhatsApp →",
    items: [
      {
        q: "Which program is right for me?",
        a: "If you're preparing to conceive, Fertility Detox. If you're already pregnant, Green Placenta. If you're pregnant and managing gestational diabetes, Soukkara. If your situation is more complicated than that, book a free evaluation call and we'll work it out with you in about fifteen minutes.",
        link: { text: "Book a free evaluation call →", href: "https://link.pregnawell.clinic/widget/booking/9wlfPmQlw1qq7btA5cQH" },
      },
      {
        q: "How much do the programs cost?",
        a: "Pricing depends on which program fits and how long you need support. Rather than quote a number that may not apply to you, we go through it on a free evaluation call, along with what's included and what results are realistic for your situation.",
        link: { text: "Get pricing on a free call →", href: "https://link.pregnawell.clinic/widget/booking/9wlfPmQlw1qq7btA5cQH" },
      },
      {
        q: "What kind of support do I actually get during a program?",
        a: "Daily live calls with our team, one-on-one consultations, a personalized nutrition plan, a vitamin and supplement guide, tracker app access, and access for your partner. Plus a private community of women in the same season. You're never doing this alone.",
        link: { text: "Ask us what's included →", href: "https://wa.me/971502804502" },
      },
      {
        q: "Is the masterclass really free?",
        a: "Yes. The HPO Axis masterclass is free, on demand, and needs no credit card. It's 60 minutes on the hormone axis behind your cycle, and at the end you can book a free evaluation call with our team if you want to go further.",
        link: { text: "Watch it now →", href: "https://pregnawell.clinic/vsl-fertility-evaluation-call-pregnawell" },
      },
      {
        q: "What is PregnaWell, and how can it help me?",
        a: "PregnaWell is a virtual clinic specializing in fertility, pregnancy, and postpartum nutrition. We run expert-led programs with daily live calls, one-on-one consultations, and personalized nutrition plans, grounded in current evidence and delivered with warmth. If you're not sure where you fit, start with the free masterclass.",
        link: { text: "Start with the free masterclass →", href: "https://pregnawell.clinic/vsl-fertility-evaluation-call-pregnawell" },
      },
      {
        q: "Are your services available internationally?",
        a: "Yes. Every program runs virtually, so you can join from anywhere. Our members are across the GCC, North America, Europe, and beyond, and the daily calls are scheduled with those time zones in mind. To check the fit for your country and schedule, book a free call and we'll confirm it with you.",
        link: { text: "Book a free call →", href: "https://link.pregnawell.clinic/widget/booking/9wlfPmQlw1qq7btA5cQH" },
      },
      {
        q: "Do you offer postpartum support?",
        a: "Yes. Postpartum nutrition and recovery support is available, arranged case by case rather than as a fixed program, since what a mother needs after birth varies enormously. Book a free call, tell us your situation, and we'll map out what makes sense.",
        link: { text: "Tell us your situation on a free call →", href: "https://link.pregnawell.clinic/widget/booking/9wlfPmQlw1qq7btA5cQH" },
      },
      {
        q: "What does the Fertility Score tool measure?",
        a: "It's a five-minute self-assessment that surfaces what your hormones, cycle, and lifestyle are saying about your fertility, and what's most worth your attention next. It's a clarity tool, not a diagnostic one. Most women take it, then bring their result to a free evaluation call and we go through it together.",
        link: { text: "Take your result to a free call →", href: "https://link.pregnawell.clinic/widget/booking/9wlfPmQlw1qq7btA5cQH" },
      },
    ],
  },
  founder: {
    eyebrow: "Meet your guide",
    title: "Hi, I'm Maha Hommos.",
    body: "Clinical dietitian, mother, and founder of PregnaWell. For over a decade I've helped women decode their bodies, from PCOS and gestational diabetes to postpartum recovery. PregnaWell is the playbook I wish every mom-to-be had.",
    masterclass: "Watch the masterclass ↗",
  },
  footer: {
    explore: "Explore",
    follow: "Follow",
    tagline:
      "Compassionate, evidence-based guidance for women on their journey from fertility to motherhood.",
    rights: "All rights reserved.",
    closing: "Made with care for moms-to-be everywhere.",
  },
  story: {
    eyebrow: "Our Story",
    title: "Built from real motherhood, backed by real science.",
    intro:
      "PregnaWell began with one belief: every woman deserves to understand her own body before, during, and after pregnancy, without confusion, fear, or guesswork.",
    body: `## Meet Maha

Maha Hommos is a clinical dietitian, public-health advocate, and founder of PregnaWell. Over the last decade she has guided more than 50,000 women through the physical and emotional landscape of fertility, pregnancy, and postpartum, across the Middle East, Europe, and North America.

Her work has been featured by Qatar Foundation, MBC Group, Rotana, Al Sharq, UAE Stories, Qatar TV, USA News, and Al Jazeera, and her social platforms reach millions of women each month with content that translates obstetric and endocrinology research into language anyone can act on.

## Why PregnaWell exists

*(Founder copy to be finalized.)* Maha started PregnaWell after years of watching the same pattern: women arriving overwhelmed, under-informed, and unsupported, even with the best healthcare around them. PregnaWell is the bridge: between the clinic and the kitchen, between the lab work and the lived experience, between the textbook and the woman holding the test.

> "I want every woman to feel the way she deserves to feel during the most important season of her life, informed, prepared, and softly supported."

## What we believe

- **Science is the floor, not the ceiling.** Every program is grounded in current evidence and updated when the evidence does.
- **Education is medicine.** Understanding your body is the single most underrated intervention in maternal health.
- **Care should travel.** Whether you're in Doha, Dubai, Toronto, or anywhere in between, you should be able to reach for help.

## What's next

PregnaWell now spans a free masterclass, a fertility self-assessment, and an ongoing library of articles and programs. Wherever you are on the journey, there's a door for you.`,
    ctas: {
      startHere: {
        eyebrow: "Start here",
        title: "Watch the free masterclass",
        body: "60 minutes on the HPO axis, with no fluff and no pitch.",
      },
      orAssess: {
        eyebrow: "Or assess yourself",
        title: "Check your fertility score",
        body: "A 5-minute self-assessment that surfaces what's actually moving the needle.",
      },
    },
  },
  blog: {
    eyebrow: "Articles",
    title: "Articles for women who want to understand their bodies.",
    subtitle: "Plain-language explainers, field notes from clinic, and tools you can use this week.",
    empty: {
      title: "Articles are on the way.",
      body: "Our first posts go live shortly. Check back soon.",
    },
    minRead: "min read",
    backAll: "All articles",
    by: "by",
    filters: { all: "All" },
    keepGoing: {
      eyebrow: "Keep going",
      title: "Watch the free masterclass on the HPO axis",
      body:
        "60 minutes that change how you think about fertility, built on the same framework we use in clinic.",
    },
    assess: {
      eyebrow: "Assess yourself",
      title: "Check your fertility score",
      body:
        "A quick 5-minute self-assessment that surfaces what's actually moving the needle in your fertility journey.",
    },
  },
  language: { en: "English", ar: "العربية", switchLabel: "Language" },
};

const ar: Dict = {
  nav: { home: "الرئيسية", story: "قصتنا", blog: "مقالات", testimonials: "شهادات" },
  cta: {
    masterclass: "شاهدي ماستر كلاس محور ال HPO مجاناً",
    masterclassShort: "شاهدي ماستر كلاس محور ال HPO مجاناً",
    fertilityScore: "مقياس الخصوبة الذكي",
    watchNow: "شاهدي الآن",
    readArticle: "اقرأي المقال",
    inquireWhatsapp: "تواصلي عبر واتساب",
    browseCourses: "تصفّحي الدورات",
    browseLibrary: "تصفّحي المكتبة",
    messageWhatsapp: "راسلينا على واتساب ←",
    chat: "محادثة",
    readMyStory: "اقرأي قصتي",
  },
  hero: {
    eyebrow: "PregnaWell · مع مها حُمُّص",
    titleLead: "نُمكّن المرأة في رحلتها نحو ",
    titleAccent: "الأمومة",
    titleTrail: ".",
    subtitle:
      "من الخصوبة إلى ما بعد الولادة، برامجنا ومواردنا التي يُشرف عليها خبراء ترافقك بالعلم والحنان والحكمة العملية في كل خطوة.",
    free: "درس مجاني مدّته ٦٠ دقيقة عن محور HPO · بدون بطاقة ائتمان",
    quote: "«رعاية مدعومة بالعلم، تُقدَّم بالدفء.»",
    quoteAttribution: "مها حُمُّص، المؤسِّسة",
  },
  stats: {
    videoViews: "مشاهدة فيديو",
    mothersSupported: "أم تمّ دعمها",
    instagramFollowers: "متابع على إنستغرام",
  },
  press: { eyebrow: "ظهرنا على" },
  why: {
    eyebrow: "لماذا PregnaWell",
    title: "رعاية حانية مبنية على الأدلة لكل أم منتظَرة.",
    subtitle:
      "تجمع مها حُمُّص بين خبرتها كأخصائية تغذية إكلينيكية وعقد من العمل مع النساء لفهم أجسادهن وهرموناتهن وخياراتهن, وتبني الأدوات التي تحتجنها فعلاً.",
  },
  programs: {
    eyebrow: "البرامج والخدمات",
    title: "برامج بإشراف الخبراء لكل مرحلة من رحلتك.",
    subtitle:
      "سواء كنتِ تستعدين للحمل، أو حاملاً بالفعل، أو تتعاملين مع سكري الحمل، هناك برنامج مصمَّم لمرحلتك تحديداً.",
    freeEyebrow: "ابدئي مجاناً",
    freeTitle: "ابدأي من هنا",
    paid: {
      fertilityDetox: {
        badge: "برنامج التحضير للحمل",
        subtitle: "٣ أشهر",
        title: "ديتوكس الخصوبة",
        description:
          "برنامجنا الأساسي للنساء المستعدات للحمل. ثلاثة أشهر من العمل المنظَّم على خصوبتك بإشراف أخصائيين وأطباء، مع دعم يومي لا ينقطع.",
        features: [
          "دورة خصوبة كاملة يقدّمها أخصائيون وأطباء",
          "جلسات مباشرة يومية، إضافةً إلى استشارات فردية",
          "خطة غذائية مخصّصة لتعزيز الخصوبة",
          "دليل الفيتامينات والمكمّلات",
          "تطبيق متابعة ووصول للشريك",
        ],
        cta: "تواصلي عبر واتساب ←",
      },
      greenPlacenta: {
        badge: "طوال فترة الحمل",
        title: "المشيمة الخضراء",
        description:
          "نفس المتابعة اليومية القريبة في برنامج ديتوكس الخصوبة، لكن مصمّمة للحامل. تغذية ودعم من الشهر الأول حتى الولادة، من دون الدورة التدريبية.",
        features: [
          "خطة غذائية مخصّصة لكل مرحلة من مراحل الحمل",
          "جلسات مباشرة يومية، إضافةً إلى استشارات فردية",
          "دليل الفيتامينات والمكمّلات للحامل",
          "تطبيق متابعة ووصول للشريك",
          "دعم يومي من الشهر الأول حتى الولادة",
        ],
        cta: "تواصلي عبر واتساب ←",
      },
      soukkara: {
        badge: "طوال فترة الحمل",
        title: "سُكّرة",
        description:
          "للحوامل اللواتي يتعاملن مع سكري الحمل. دورة مخصّصة لسكري الحمل، إضافةً إلى كل ما في برنامج الحمل: جلسات يومية، واستشارات فردية، وخطة غذائية مبنية على قراءات السكر لديكِ.",
        features: [
          "دورة مخصّصة لسكري الحمل",
          "خطة غذائية مبنية على قراءات السكر لديكِ",
          "جلسات مباشرة يومية، إضافةً إلى استشارات فردية",
          "دليل الفيتامينات والمكمّلات",
          "تطبيق متابعة ووصول للشريك",
        ],
        cta: "تواصلي عبر واتساب ←",
      },
    },
    free: {
      podcast: {
        badge: "بودكاست",
        title: "Talk حامل",
        description:
          "حوارات مطوّلة تجمع الأخصائية مها حمص بأطباء ومختصين، تتناول رحلة الحمل من نواحيها الطبية والنفسية معاً. قصص حقيقية، بحقّها.",
        features: [
          "حلقات كاملة مجاناً على يوتيوب",
          "ضيف مختص في كل حلقة",
          "الخصوبة والحمل وكل ما يحيط بهما",
        ],
        cta: "استمعي للبودكاست ←",
      },
      youtube: {
        badge: "يوتيوب",
        title: "فيديوهات الخصوبة الطويلة",
        description:
          "حلقات كاملة تأخذ فيها الأخصائية مها موضوعاً واحداً في الخصوبة وتشرحه بعمق لا يتيحه أي فيديو قصير.",
        features: [
          "فيديوهات معمّقة عن الخصوبة والهرمونات والتغذية",
          "مجاناً، بلا تسجيل، في أي وقت",
          "المكتبة الكاملة على القناة",
        ],
        cta: "شاهدي على يوتيوب ↗",
      },
      masterclass: {
        badge: "ماستر كلاس مجاني",
        title: "ماستر كلاس محور الـHPO",
        description:
          "درس مجاني مدّته ٦٠ دقيقة عن المحور الهرموني الذي يتحكّم بدورتك وخصوبتك. أفضل نقطة بداية إذا أردتِ أن تفهمي ما يحدث في جسدك فعلاً.",
        features: [
          "٦٠ دقيقة، متاح عند الطلب",
          "بدون بطاقة ائتمان",
          "إمكانية حجز جلسة تقييم مجانية في نهايته",
        ],
        cta: "شاهدي الآن ←",
      },
      articles: {
        badge: "مقالات",
        title: "مكتبة المقالات",
        description:
          "أدلة مكتوبة عن الخصوبة والهرمونات وتغذية الحمل وسكري الحمل. مبنية على الأدلة، ومكتوبة لتقرأها امرأة ليست طبيبة.",
        features: [
          "الخصوبة وصحة الهرمونات",
          "تغذية الحمل وسكري الحمل",
          "مجانية وبلا تسجيل",
        ],
        cta: "اقرأي المقالات ←",
      },
    },
  },
  testimonials: {
    eyebrow: "ماذا تقول الأمهات",
    title: "محبوبٌ من النساء في كل مرحلة من الرحلة.",
    items: [
      {
        quote: "نصائح PregnaWell لإدارة سكري الحمل غيّرت حياتي!",
        name: "سارة",
        role: "أم لطفلين",
      },
      {
        quote: "أحببتُ برنامج المشيمة الخضراء, ساعدني على التعافي بسرعة أكبر بكثير!",
        name: "أماندا",
        role: "أم جديدة",
      },
      {
        quote:
          "كأم لأول مرة كان عندي أسئلة كثيرة. موارد PregnaWell جعلت كل شيء يبدو ممكناً وحتى ممتعاً!",
        name: "ليلى",
        role: "أم جديدة",
      },
      {
        quote:
          "نهجهم الشامل في التعافي بعد الولادة ساعدني على استعادة قوّتي وثقتي أسرع مما تخيّلت.",
        name: "مايا",
        role: "أم لتوأم",
      },
    ],
  },
  faq: {
    eyebrow: "الأسئلة الشائعة",
    title: "إجابات على أكثر الأسئلة شيوعاً.",
    helper:
      "لا ترين سؤالك؟ تواصلي معنا على واتساب وسنرد عليك شخصياً.",
    contact: "راسلينا على واتساب ←",
    items: [
      {
        q: "أي برنامج يناسبني؟",
        a: "إذا كنتِ تستعدين للحمل، فبرنامج ديتوكس الخصوبة. إذا كنتِ حاملاً، فالمشيمة الخضراء. إذا كنتِ حاملاً وتتعاملين مع سكري الحمل، فسُكّرة. وإذا كان وضعك أكثر تعقيداً، فاحجزي جلسة تقييم مجانية ونحدّد الأنسب لكِ خلال خمس عشرة دقيقة تقريباً.",
        link: { text: "احجزي جلسة تقييم مجانية ←", href: "https://link.pregnawell.clinic/widget/booking/9wlfPmQlw1qq7btA5cQH" },
      },
      {
        q: "كم تكلفة البرامج؟",
        a: "السعر يعتمد على البرنامج المناسب لكِ وعلى المدة التي تحتاجينها من الدعم. بدل أن نذكر رقماً قد لا ينطبق على حالتك، نناقشه في جلسة تقييم مجانية، مع ما يتضمّنه البرنامج والنتائج الواقعية لوضعك.",
        link: { text: "اعرفي الأسعار في جلسة مجانية ←", href: "https://link.pregnawell.clinic/widget/booking/9wlfPmQlw1qq7btA5cQH" },
      },
      {
        q: "ما نوع الدعم الذي أحصل عليه خلال البرنامج؟",
        a: "جلسات مباشرة يومية مع فريقنا، واستشارات فردية، وخطة غذائية مخصّصة، ودليل الفيتامينات والمكمّلات، ووصول إلى تطبيق المتابعة، ووصول لشريكك. إضافةً إلى مجتمع خاص من النساء اللواتي يمررن بنفس المرحلة. لن تكوني وحدك أبداً.",
        link: { text: "اسألينا عمّا يتضمّنه البرنامج ←", href: "https://wa.me/971502804502" },
      },
      {
        q: "هل الماستر كلاس مجاني فعلاً؟",
        a: "نعم. ماستر كلاس محور الـHPO مجاني، متاح عند الطلب، ولا يحتاج بطاقة ائتمان. ستون دقيقة عن المحور الهرموني خلف دورتك، وفي نهايته يمكنك حجز جلسة تقييم مجانية مع فريقنا إذا أردتِ المتابعة.",
        link: { text: "شاهديه الآن ←", href: "https://pregnawell.clinic/vsl-fertility-evaluation-call-pregnawell" },
      },
      {
        q: "ما هي PregnaWell، وكيف يمكن أن تساعدني؟",
        a: "PregnaWell عيادة افتراضية متخصّصة في تغذية الخصوبة والحمل وما بعد الولادة. نُقدّم برامج بإشراف الخبراء تتضمّن جلسات مباشرة يومية، واستشارات فردية، وخطط غذائية مخصّصة، مبنية على الأدلة الحديثة ومُقدَّمة بالدفء. إذا لم تكوني متأكدة أين تقعين، ابدئي بالماستر كلاس المجاني.",
        link: { text: "ابدئي بالماستر كلاس المجاني ←", href: "https://pregnawell.clinic/vsl-fertility-evaluation-call-pregnawell" },
      },
      {
        q: "هل خدماتكم متاحة دولياً؟",
        a: "نعم. كل برامجنا تُقدَّم افتراضياً، فيمكنك الانضمام من أي مكان. مشتركاتنا من دول الخليج وأمريكا الشمالية وأوروبا وغيرها، والجلسات اليومية مجدولة بما يراعي هذه الفوارق الزمنية. للتأكد من ملاءمة البرنامج لبلدك وجدولك، احجزي جلسة مجانية ونؤكّد لكِ ذلك.",
        link: { text: "احجزي جلسة مجانية ←", href: "https://link.pregnawell.clinic/widget/booking/9wlfPmQlw1qq7btA5cQH" },
      },
      {
        q: "هل تقدّمون دعماً لما بعد الولادة؟",
        a: "نعم. دعم التغذية والتعافي بعد الولادة متاح، ويُرتَّب لكل حالة على حدة بدل أن يكون برنامجاً ثابتاً، لأن ما تحتاجه الأم بعد الولادة يختلف كثيراً من واحدة لأخرى. احجزي جلسة مجانية وأخبرينا بوضعك، ونرسم معكِ ما يناسبك.",
        link: { text: "أخبرينا بوضعك في جلسة مجانية ←", href: "https://link.pregnawell.clinic/widget/booking/9wlfPmQlw1qq7btA5cQH" },
      },
      {
        q: "ماذا يقيس مقياس الخصوبة الذكي؟",
        a: "تقييم ذاتي مدّته خمس دقائق يكشف ما تقوله هرموناتك ودورتك ونمط حياتك عن خصوبتك، وما الأَوْلى بالاهتمام تالياً. هي أداة وضوح لا أداة تشخيص. معظم النساء يجرينه، ثم يناقشن النتيجة معنا في جلسة تقييم مجانية.",
        link: { text: "ناقشي نتيجتك في جلسة مجانية ←", href: "https://link.pregnawell.clinic/widget/booking/9wlfPmQlw1qq7btA5cQH" },
      },
    ],
  },
  founder: {
    eyebrow: "تعرّفي على دليلتك",
    title: "أهلاً، أنا مها حُمُّص.",
    body:
      "أخصائية تغذية إكلينيكية، وأم، ومؤسِّسة PregnaWell. منذ أكثر من عقد وأنا أساعد النساء على فهم أجسادهن, من تكيُّس المبايض وسكري الحمل إلى التعافي بعد الولادة. PregnaWell هي الدليل الذي تمنّيت لو كان بين يدي كل أم منتظَرة.",
    masterclass: "شاهدي الدرس ↗",
  },
  footer: {
    explore: "تصفّحي",
    follow: "تابعي",
    tagline:
      "إرشاد حانٍ مبني على الأدلة للنساء في رحلتهن من الخصوبة إلى الأمومة.",
    rights: "جميع الحقوق محفوظة.",
    closing: "صُنع بحب لكل أم منتظَرة في كل مكان.",
  },
  story: {
    eyebrow: "قصتنا",
    title: "بُنيت من واقع الأمومة، ومدعومة بالعلم الحقيقي.",
    intro:
      "بدأت PregnaWell بقناعة واحدة: كل امرأة تستحق أن تفهم جسدها قبل الحمل وأثناءه وبعده, بلا تشوش أو خوف أو تخمين.",
    body: `## تعرّفي على مها

مها حُمُّص أخصائية تغذية إكلينيكية، وناشطة في الصحة العامة، ومؤسِّسة PregnaWell. على مدى العقد الماضي، رافقت أكثر من ٥٠٬٠٠٠ امرأة عبر المشهد الجسدي والعاطفي للخصوبة والحمل وما بعد الولادة, في الشرق الأوسط وأوروبا وأمريكا الشمالية.

ظهر عملها على Qatar Foundation و MBC Group وروتانا والشرق و UAE Stories وقناة قطر و USA News والجزيرة، وتصل منصاتها الاجتماعية إلى ملايين النساء شهرياً بمحتوى يُترجم أبحاث التوليد والغدد الصمّ إلى لغة قابلة للتطبيق.

## لماذا وُجدت PregnaWell

*(نص المؤسِّسة قيد الإعداد.)* بدأت مها PregnaWell بعد سنوات من رؤية النمط ذاته يتكرر: نساء يصلن مرهقات، ناقصات المعلومات، وغير مدعومات, حتى مع أفضل أنظمة الرعاية حولهن. PregnaWell هي الجسر: بين العيادة والمطبخ، بين التحاليل والتجربة المعاشة، بين الكتاب والمرأة التي تحمل الفحص.

> «أريد كل امرأة أن تشعر كما تستحق أن تشعر في أهم مرحلة من حياتها, مُطّلعة، مُستعدّة، ومُحاطة بالدفء.»

## ما الذي نؤمن به

- **العلم هو الأرضية، لا السقف.** كل برنامج مبني على الأدلة الحديثة ويُحدَّث حين تُحدَّث الأدلة.
- **التعليم دواء.** فهم جسدك هو أكثر تدخّل صحي مُهمَل في صحة الأمهات.
- **الرعاية ينبغي أن تسافر.** سواء كنتِ في الدوحة أو دبي أو تورنتو أو أي مكان بينها، يجب أن تستطيعي طلب المساعدة.

## ما القادم

تشمل PregnaWell الآن درساً مجانياً، وأداة تقييم ذاتي للخصوبة، ومكتبة مستمرة من المقالات والبرامج. أينما كنتِ في الرحلة، هناك باب لك.`,
    ctas: {
      startHere: {
        eyebrow: "ابدئي من هنا",
        title: "شاهدي ماستر كلاس محور ال HPO مجاناً",
        body: "٦٠ دقيقة عن محور HPO، بلا حشو ولا عرض ترويجي.",
      },
      orAssess: {
        eyebrow: "أو قيّمي نفسك",
        title: "مقياس الخصوبة الذكي",
        body: "تقييم ذاتي مدّته ٥ دقائق يكشف ما يُحدث الفرق فعلاً.",
      },
    },
  },
  blog: {
    eyebrow: "مقالات",
    title: "مقالات للنساء اللواتي يردن فهم أجسادهن.",
    subtitle:
      "شروحات بلغة بسيطة، وملاحظات من العيادة، وأدوات يمكنك استخدامها هذا الأسبوع.",
    empty: {
      title: "المقالات في الطريق.",
      body: "أول مقالاتنا ستُنشر قريباً. عودي لنا بعد قليل.",
    },
    minRead: "دقيقة قراءة",
    backAll: "كل المقالات",
    by: "بقلم",
    filters: { all: "الكل" },
    keepGoing: {
      eyebrow: "تابعي",
      title: "شاهدي ماستر كلاس محور ال HPO مجاناً",
      body:
        "٦٠ دقيقة تُغيّر طريقة تفكيرك في الخصوبة, مبنية على نفس الإطار الذي نستخدمه في العيادة.",
    },
    assess: {
      eyebrow: "قيّمي نفسك",
      title: "مقياس الخصوبة الذكي",
      body:
        "تقييم ذاتي سريع مدّته ٥ دقائق يكشف لكِ ما يُحدث الفرق فعلاً في رحلة الخصوبة.",
    },
  },
  language: { en: "English", ar: "العربية", switchLabel: "اللغة" },
};

const dictionaries: Record<Locale, Dict> = { en, ar };

export function getDict(locale: Locale): Dict {
  return dictionaries[locale];
}

// =============================================================================
// Pathname helpers
// =============================================================================

export function localeFromPathname(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0];
  return isLocale(seg) ? seg : defaultLocale;
}

export function stripLocale(pathname: string): string {
  const parts = pathname.split("/");
  if (parts.length > 1 && isLocale(parts[1])) {
    parts.splice(1, 1);
  }
  const stripped = parts.join("/") || "/";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

export function withLocale(locale: Locale, pathname: string): string {
  const stripped = stripLocale(pathname);
  if (stripped === "/") return `/${locale}`;
  return `/${locale}${stripped}`;
}
