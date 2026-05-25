import Link from "next/link";
import { site } from "@/lib/site";
import { getDict, type Locale } from "@/lib/i18n";

type ProgramKey = keyof ReturnType<typeof getDict>["programs"]["items"];

const PROGRAM_KEYS: { key: ProgramKey; href: string; external?: boolean; ctaKey: keyof ReturnType<typeof getDict>["cta"]; tone: "rose" | "purple" | "cream" }[] = [
  { key: "nawat",         href: site.ctas.whatsapp,    external: true, ctaKey: "inquireWhatsapp",  tone: "rose"   },
  { key: "greenPlacenta", href: site.ctas.whatsapp,    external: true, ctaKey: "inquireWhatsapp",  tone: "purple" },
  { key: "soukkara",      href: site.ctas.whatsapp,    external: true, ctaKey: "inquireWhatsapp",  tone: "cream"  },
  { key: "crash",         href: site.ctas.masterclass, external: true, ctaKey: "browseCourses",    tone: "cream"  },
  { key: "masterclasses", href: site.ctas.masterclass, external: true, ctaKey: "watchNow",          tone: "purple" },
  { key: "freeResources", href: "/blog",                                ctaKey: "browseLibrary",    tone: "rose"   },
];

export default function Programs({ locale }: { locale: Locale }) {
  const dict = getDict(locale);
  return (
    <section id="programs" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
            {dict.programs.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-[var(--brand-purple-deep)]">
            {dict.programs.title}
          </h2>
          <p className="mt-4 text-[var(--brand-muted)] leading-relaxed">
            {dict.programs.subtitle}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PROGRAM_KEYS.map(({ key, href, external, ctaKey, tone }) => {
            const item = dict.programs.items[key];
            const finalHref = href === "/blog" ? `/${locale}/blog` : href;
            return (
              <ProgramCard
                key={key}
                badge={item.badge}
                title={item.title}
                subtitle={item.subtitle}
                description={item.description}
                features={item.features}
                href={finalHref}
                external={external}
                cta={dict.cta[ctaKey]}
                tone={tone}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

type CardProps = {
  badge: string;
  title: string;
  subtitle?: string;
  description: string;
  features: readonly string[];
  href: string;
  external?: boolean;
  cta: string;
  tone: "rose" | "purple" | "cream";
};

function ProgramCard(p: CardProps) {
  const toneClasses =
    p.tone === "rose"
      ? "bg-[var(--brand-blush)] ring-[var(--brand-rose-soft)]/40"
      : p.tone === "purple"
      ? "bg-[var(--brand-purple-deep)] text-white ring-[var(--brand-purple-deep)]"
      : "bg-white ring-[var(--brand-purple)]/10";

  const isPurple = p.tone === "purple";
  const titleColor = isPurple ? "text-white" : "text-[var(--brand-purple-deep)]";
  const bodyColor = isPurple ? "text-white/85" : "text-[var(--brand-muted)]";
  const badgeColor = isPurple
    ? "bg-white/15 text-white"
    : "bg-white text-[var(--brand-rose)] ring-1 ring-[var(--brand-rose-soft)]/40";
  const checkColor = isPurple ? "text-[var(--brand-rose-soft)]" : "text-[var(--brand-rose)]";
  const ctaColor = isPurple ? "text-white" : "text-[var(--brand-purple)]";

  return (
    <article
      className={`group relative flex flex-col rounded-3xl p-7 ring-1 transition shadow-[0_15px_40px_-25px_rgba(61,42,110,0.35)] hover:-translate-y-1 ${toneClasses}`}
    >
      {p.badge && (
        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${badgeColor}`}
        >
          {p.badge}
        </span>
      )}
      <h3 className={`mt-4 font-display text-xl ${titleColor}`}>{p.title}</h3>
      {p.subtitle && (
        <p className={`mt-1 text-sm font-medium ${isPurple ? "text-[var(--brand-rose-soft)]" : "text-[var(--brand-rose)]"}`}>
          {p.subtitle}
        </p>
      )}
      <p className={`mt-3 text-sm leading-relaxed ${bodyColor}`}>{p.description}</p>
      <ul className="mt-5 space-y-2">
        {p.features.map((f) => (
          <li key={f} className={`flex items-start gap-2 text-sm ${bodyColor}`}>
            <span className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${checkColor}`} style={{ background: "currentColor" }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 pt-1">
        <Link
          href={p.href}
          target={p.external ? "_blank" : undefined}
          rel={p.external ? "noopener noreferrer" : undefined}
          className={`inline-flex items-center gap-2 text-sm font-semibold ${ctaColor}`}
        >
          {p.cta}{" "}
          <span aria-hidden className="arrow-end transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
