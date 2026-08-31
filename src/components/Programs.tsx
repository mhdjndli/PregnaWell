import Link from "next/link";
import { site } from "@/lib/site";
import { getDict, type Locale } from "@/lib/i18n";

type PaidKey = "fertilityDetox" | "greenPlacenta" | "soukkara";
type FreeKey = "podcast" | "youtube" | "masterclass" | "articles";

type PaidEntry = { key: PaidKey; href: string; external: boolean; tone: "rose" | "purple" | "cream" };
type FreeEntry = { key: FreeKey; href: string; external: boolean; featured?: boolean };

const PAID: PaidEntry[] = [
  { key: "fertilityDetox", href: site.ctas.whatsapp, external: true, tone: "rose" },
  { key: "greenPlacenta", href: site.ctas.whatsapp, external: true, tone: "purple" },
  { key: "soukkara", href: site.ctas.whatsapp, external: true, tone: "cream" },
];

const FREE_BASE: Omit<FreeEntry, "href">[] = [
  { key: "podcast", external: true },
  { key: "youtube", external: true },
  { key: "masterclass", external: true, featured: true },
  { key: "articles", external: false },
];

function freeHref(key: FreeKey, locale: Locale): string {
  switch (key) {
    case "podcast":
      return site.ctas.podcast;
    case "youtube":
      return site.ctas.youtube;
    case "masterclass":
      return site.ctas.masterclass;
    case "articles":
      return `/${locale}/blog`;
  }
}

export default function Programs({ locale }: { locale: Locale }) {
  const dict = getDict(locale);

  return (
    <section id="programs" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Section header */}
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

        {/* Band 1: Paid programs */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PAID.map(({ key, href, external, tone }) => {
            const item = dict.programs.paid[key];
            return (
              <PaidProgramCard
                key={key}
                badge={item.badge}
                subtitle={item.subtitle}
                title={item.title}
                description={item.description}
                features={item.features}
                href={href}
                external={external}
                cta={item.cta}
                tone={tone}
              />
            );
          })}
        </div>

        {/* Band 2 heading */}
        <div className="mt-20 lg:mt-24 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
            {dict.programs.freeEyebrow}
          </p>
          <h3 className="mt-3 font-display text-2xl md:text-3xl text-[var(--brand-purple-deep)]">
            {dict.programs.freeTitle}
          </h3>
        </div>

        {/* Band 2: Free resources */}
        <div className="mt-10 grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {FREE_BASE.map(({ key, external, featured }) => {
            const item = dict.programs.free[key];
            return (
              <FreeResourceCard
                key={key}
                badge={item.badge}
                title={item.title}
                description={item.description}
                features={item.features}
                href={freeHref(key, locale)}
                external={external}
                cta={item.cta}
                featured={!!featured}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

type PaidCardProps = {
  badge: string;
  subtitle?: string;
  title: string;
  description: string;
  features: readonly string[];
  href: string;
  external?: boolean;
  cta: string;
  tone: "rose" | "purple" | "cream";
};

function PaidProgramCard(p: PaidCardProps) {
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
  const subtitleColor = isPurple ? "text-[var(--brand-rose-soft)]" : "text-[var(--brand-rose)]";
  const bulletColor = isPurple ? "text-[var(--brand-rose-soft)]" : "text-[var(--brand-rose)]";
  const ctaColor = isPurple ? "text-white" : "text-[var(--brand-purple)]";

  return (
    <article
      className={`group relative flex flex-col rounded-3xl p-7 ring-1 transition shadow-[0_15px_40px_-25px_rgba(61,42,110,0.35)] hover:-translate-y-1 ${toneClasses}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${badgeColor}`}
        >
          {p.badge}
        </span>
        {p.subtitle && (
          <span
            dir="auto"
            className={`text-xs font-semibold ${subtitleColor}`}
          >
            {p.subtitle}
          </span>
        )}
      </div>
      <h3 dir="auto" className={`mt-4 font-display text-xl ${titleColor}`}>
        {p.title}
      </h3>
      <p className={`mt-3 text-sm leading-relaxed ${bodyColor}`}>{p.description}</p>
      <ul className="mt-5 space-y-2">
        {p.features.map((f) => (
          <li key={f} className={`flex items-start gap-2 text-sm ${bodyColor}`}>
            <span
              className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${bulletColor}`}
              style={{ background: "currentColor" }}
            />
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
          {p.cta}
        </Link>
      </div>
    </article>
  );
}

type FreeCardProps = {
  badge: string;
  title: string;
  description: string;
  features: readonly string[];
  href: string;
  external?: boolean;
  cta: string;
  featured: boolean;
};

function FreeResourceCard(p: FreeCardProps) {
  const cardBase =
    "group relative flex h-full flex-col rounded-2xl bg-white p-5 ring-1 shadow-[0_10px_30px_-20px_rgba(61,42,110,0.25)] transition hover:-translate-y-1";
  const cardRing = p.featured
    ? "ring-[var(--brand-rose-soft)]/60"
    : "ring-[var(--brand-purple)]/10";

  return (
    <article className={`${cardBase} ${cardRing}`}>
      <span className="inline-flex w-fit items-center rounded-full bg-[var(--brand-blush)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-rose)]">
        {p.badge}
      </span>
      <h4
        dir="auto"
        className="mt-3 font-display text-base leading-snug text-[var(--brand-purple-deep)]"
      >
        {p.title}
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-[var(--brand-muted)]">
        {p.description}
      </p>
      <ul className="mt-4 space-y-1.5">
        {p.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-xs leading-relaxed text-[var(--brand-muted)]"
          >
            <span
              className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-[var(--brand-rose)]"
              style={{ background: "currentColor" }}
            />
            <span className="text-[var(--brand-muted)]">{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 pt-1">
        {p.featured ? (
          <Link
            href={p.href}
            target={p.external ? "_blank" : undefined}
            rel={p.external ? "noopener noreferrer" : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-purple)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-purple-deep)] transition"
          >
            {p.cta}
          </Link>
        ) : (
          <Link
            href={p.href}
            target={p.external ? "_blank" : undefined}
            rel={p.external ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            {p.cta}
          </Link>
        )}
      </div>
    </article>
  );
}
