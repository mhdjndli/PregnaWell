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
  nav: { home: string; story: string; blog: string; pregnaScanApp: string };
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
    items: Record<
      "nawat" | "greenPlacenta" | "soukkara" | "crash" | "masterclasses" | "freeResources",
      { badge: string; title: string; subtitle?: string; description: string; features: string[] }
    >;
  };
  testimonials: { eyebrow: string; title: string; items: { quote: string; name: string; role: string }[] };
  faq: {
    eyebrow: string;
    title: string;
    helper: string;
    contact: string;
    items: { q: string; a: string }[];
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
    keepGoing: { eyebrow: string; title: string; body: string };
  };
  language: { en: string; ar: string; switchLabel: string };
};

const en: Dict = {
  nav: { home: "Home", story: "Story", blog: "Blog", pregnaScanApp: "PregnaScan App" },
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
    title: "Expert-led programs for every stage of motherhood.",
    subtitle:
      "From fertility preparation to postpartum recovery, pick the path that meets you where you are.",
    items: {
      nawat: {
        badge: "Nawat",
        title: "Pregnancy Preparation Program",
        description:
          "A complete wellness program to prepare your body for pregnancy with expert-guided nutrition and holistic care.",
        features: [
          "Assessments & recommendations",
          "Tailored fertility-boosting meal plans",
          "Mind-body exercises",
        ],
      },
      greenPlacenta: {
        badge: "Green Placenta",
        title: "Postpartum Recovery Program",
        description:
          "A post-pregnancy recovery program with customized diet plans and health tips to restore energy and vitality.",
        features: ["Customized meal plans", "Expert one-on-one advice", "Community access"],
      },
      soukkara: {
        badge: "Soukkara",
        title: "Gestational Diabetes Program",
        description:
          "A focused program to help manage gestational diabetes with personalized meal plans, expert tips, and emotional support.",
        features: [
          "Personalized meal plans",
          "Weekly glucose tracking",
          "Expert tips and exercises",
        ],
      },
      crash: {
        badge: "Self-paced",
        title: "Crash Courses",
        description:
          "Affordable, focused sessions on labor prep, postpartum care, and nutrition, with lifetime access.",
        features: [
          "Affordable, focused sessions",
          "Downloadable resources",
          "Flexible, self-paced learning",
        ],
      },
      masterclasses: {
        badge: "Free",
        title: "Masterclasses",
        subtitle: "Start with the HPO Axis masterclass",
        description:
          "Free, expert-led sessions providing actionable insights into fertility, pregnancy, and postpartum care.",
        features: [
          "Live Q&A sessions",
          "Downloadable Pregnancy Wellness Checklist",
          "Lifetime access to the recording",
        ],
      },
      freeResources: {
        badge: "Library",
        title: "Free Resources",
        description:
          "A collection of free eBooks, checklists, and video tutorials to support moms during pregnancy and postpartum.",
        features: ["Free eBooks and guides", "Printable checklists", "Relaxation video tutorials"],
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
        q: "What is PregnaWell, and how can it help me?",
        a: "PregnaWell is a virtual health clinic specializing in fertility, pregnancy, and postpartum support. We provide expert-led programs, masterclasses, and resources to empower women throughout their motherhood journey, grounded in current evidence and delivered with warmth.",
      },
      {
        q: "Are your services available internationally?",
        a: "Yes. Every program and resource is delivered virtually, so you can join from anywhere in the world. Our community already includes women across the GCC, North America, Europe, and beyond.",
      },
      {
        q: "Can I access support during the programs?",
        a: "Absolutely. Each program includes direct access to our team for your questions, regular check-ins, and a private community of women going through the same season, so you're never doing this alone.",
      },
      {
        q: "Is the masterclass really free?",
        a: "Yes, the HPO Axis masterclass is free, on-demand, and requires no credit card. It's the best place to start if you want a foundation in fertility before committing to anything else.",
      },
      {
        q: "What does the Fertility Score tool actually measure?",
        a: "The Fertility Score is a 5-minute self-assessment that surfaces what your hormones, cycle, and lifestyle are telling you about your fertility, and what's most worth your attention next. It's not a diagnostic tool; it's a clarity tool.",
      },
      {
        q: "How is PregnaScan different from the website?",
        a: "PregnaScan is a separate app built for expecting parents, it turns your medical scans and labs into clear, week-by-week understanding. You can find it at pregnascan.app.",
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

PregnaWell now spans a free masterclass, a fertility self-assessment, the PregnaScan App for expecting parents, and an ongoing library of articles and programs. Wherever you are on the journey, there's a door for you.`,
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
    eyebrow: "The PregnaWell Blog",
    title: "Articles for women who want to understand their bodies.",
    subtitle: "Plain-language explainers, field notes from clinic, and tools you can use this week.",
    empty: {
      title: "Articles are on the way.",
      body: "Our first posts go live shortly. Check back soon.",
    },
    minRead: "min read",
    backAll: "All articles",
    by: "by",
    keepGoing: {
      eyebrow: "Keep going",
      title: "Watch the free masterclass on the HPO axis",
      body:
        "60 minutes that change how you think about fertility, built on the same framework we use in clinic.",
    },
  },
  language: { en: "English", ar: "العربية", switchLabel: "Language" },
};

const ar: Dict = {
  nav: { home: "الرئيسية", story: "قصتنا", blog: "المدونة", pregnaScanApp: "تطبيق PregnaScan" },
  cta: {
    masterclass: "شاهدي الدرس المجاني",
    masterclassShort: "شاهدي الدرس المجاني",
    fertilityScore: "احسبي مؤشر الخصوبة لديك",
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
    title: "برامج بإشراف الخبراء لكل مرحلة من مراحل الأمومة.",
    subtitle:
      "من الاستعداد للحمل إلى التعافي بعد الولادة, اختاري المسار الذي يُلائم مرحلتك.",
    items: {
      nawat: {
        badge: "نواة",
        title: "برنامج الاستعداد للحمل",
        description:
          "برنامج عافية متكامل لتهيئة جسدك للحمل بتغذية موجَّهة من خبراء ورعاية شاملة.",
        features: [
          "تقييمات وتوصيات",
          "خطط وجبات مُصمَّمة لتعزيز الخصوبة",
          "تمارين للجسم والعقل",
        ],
      },
      greenPlacenta: {
        badge: "المشيمة الخضراء",
        title: "برنامج التعافي بعد الولادة",
        description:
          "برنامج للتعافي بعد الحمل بخطط غذائية مخصّصة ونصائح صحية لاستعادة الطاقة والحيوية.",
        features: ["خطط وجبات مخصّصة", "استشارة فردية مع الخبراء", "وصول إلى المجتمع"],
      },
      soukkara: {
        badge: "سُكّرة",
        title: "برنامج سكري الحمل",
        description:
          "برنامج مُركَّز لإدارة سكري الحمل بخطط وجبات شخصية ونصائح من الخبراء ودعم نفسي.",
        features: [
          "خطط وجبات شخصية",
          "متابعة أسبوعية لمستوى السكر",
          "نصائح وتمارين من الخبراء",
        ],
      },
      crash: {
        badge: "تعلُّم ذاتي",
        title: "دورات مكثَّفة",
        description:
          "جلسات مُركَّزة وميسورة عن الاستعداد للولادة، الرعاية بعد الولادة، والتغذية, مع وصول مدى الحياة.",
        features: [
          "جلسات مُركَّزة وميسورة",
          "موارد قابلة للتنزيل",
          "تعلُّم ذاتي ومرن",
        ],
      },
      masterclasses: {
        badge: "مجاني",
        title: "الدروس المتقدّمة",
        subtitle: "ابدئي بدرس محور HPO",
        description:
          "جلسات مجانية بإشراف الخبراء تُقدّم رؤى عملية في الخصوبة والحمل وما بعد الولادة.",
        features: [
          "أسئلة وأجوبة مباشرة",
          "قائمة عافية الحمل قابلة للتنزيل",
          "وصول مدى الحياة إلى التسجيل",
        ],
      },
      freeResources: {
        badge: "مكتبة",
        title: "موارد مجانية",
        description:
          "مجموعة من الكتب الإلكترونية المجانية، وقوائم التحقّق، ودروس الفيديو لدعم الأمهات أثناء الحمل وبعده.",
        features: [
          "كتب إلكترونية وأدلة مجانية",
          "قوائم تحقّق قابلة للطباعة",
          "دروس فيديو للاسترخاء",
        ],
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
        q: "ما هي PregnaWell، وكيف يمكن أن تساعدني؟",
        a: "PregnaWell عيادة صحية افتراضية متخصّصة في الخصوبة والحمل ودعم ما بعد الولادة. نُقدّم برامج بإشراف الخبراء، ودروساً، وموارد لتمكين النساء طوال رحلة الأمومة, مبنية على الأدلة الحديثة ومُقدَّمة بالدفء.",
      },
      {
        q: "هل خدماتكم متاحة دولياً؟",
        a: "نعم. كل برنامج ومورد يُقدَّم افتراضياً، فيمكنك الانضمام من أي مكان في العالم. مجتمعنا يضم بالفعل نساء من دول الخليج وأمريكا الشمالية وأوروبا وما وراءها.",
      },
      {
        q: "هل يمكنني الحصول على دعم خلال البرامج؟",
        a: "بالتأكيد. كل برنامج يتضمّن وصولاً مباشراً إلى فريقنا للأسئلة، ومتابعات منتظمة، ومجتمع خاص من النساء اللواتي يمررن بنفس المرحلة, لن تكوني وحدك أبداً.",
      },
      {
        q: "هل الدرس المتقدّم مجاني فعلاً؟",
        a: "نعم, درس محور HPO مجاني، عند الطلب، ولا يحتاج إلى بطاقة ائتمان. هو أفضل نقطة بداية إذا أردت أساساً متيناً في الخصوبة قبل الالتزام بأي شيء آخر.",
      },
      {
        q: "ماذا تقيس أداة مؤشر الخصوبة فعلاً؟",
        a: "مؤشر الخصوبة تقييم ذاتي مدّته ٥ دقائق يكشف ما تقوله هرموناتك ودورتك ونمط حياتك عن خصوبتك, وما الأَوْلى بالاهتمام تالياً. ليست أداة تشخيصية، بل أداة وضوح.",
      },
      {
        q: "كيف يختلف PregnaScan عن الموقع؟",
        a: "PregnaScan تطبيق منفصل مخصّص للأبوين المنتظَرَين, يُحوّل الفحوصات والتحاليل إلى فهم واضح أسبوعاً بأسبوع. تجدينه على pregnascan.app.",
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

تشمل PregnaWell الآن درساً مجانياً، وأداة تقييم ذاتي للخصوبة، وتطبيق PregnaScan للأبوين المنتظَرَين، ومكتبة مستمرة من المقالات والبرامج. أينما كنتِ في الرحلة، هناك باب لك.`,
    ctas: {
      startHere: {
        eyebrow: "ابدئي من هنا",
        title: "شاهدي الدرس المجاني",
        body: "٦٠ دقيقة عن محور HPO، بلا حشو ولا عرض ترويجي.",
      },
      orAssess: {
        eyebrow: "أو قيّمي نفسك",
        title: "احسبي مؤشر الخصوبة لديك",
        body: "تقييم ذاتي مدّته ٥ دقائق يكشف ما يُحدث الفرق فعلاً.",
      },
    },
  },
  blog: {
    eyebrow: "مدونة PregnaWell",
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
    keepGoing: {
      eyebrow: "تابعي",
      title: "شاهدي الدرس المجاني عن محور HPO",
      body:
        "٦٠ دقيقة تُغيّر طريقة تفكيرك في الخصوبة, مبنية على نفس الإطار الذي نستخدمه في العيادة.",
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
