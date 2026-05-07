import Link from "next/link";
import { site } from "@/lib/site";

type Program = {
  badge?: string;
  title: string;
  subtitle?: string;
  description: string;
  features: string[];
  href: string;
  external?: boolean;
  cta: string;
  tone: "rose" | "purple" | "cream";
};

const programs: Program[] = [
  {
    badge: "Nawat",
    title: "Pregnancy Preparation Program",
    description:
      "A complete wellness program to prepare your body for pregnancy with expert-guided nutrition and holistic care.",
    features: [
      "Assessments & recommendations",
      "Tailored fertility-boosting meal plans",
      "Mind-body exercises",
    ],
    href: site.ctas.whatsapp,
    external: true,
    cta: "Inquire on WhatsApp",
    tone: "rose",
  },
  {
    badge: "Green Placenta",
    title: "Postpartum Recovery Program",
    description:
      "A post-pregnancy recovery program with customized diet plans and health tips to restore energy and vitality.",
    features: [
      "Customized meal plans",
      "Expert one-on-one advice",
      "Community access",
    ],
    href: site.ctas.whatsapp,
    external: true,
    cta: "Inquire on WhatsApp",
    tone: "purple",
  },
  {
    badge: "Soukkara",
    title: "Gestational Diabetes Program",
    description:
      "A focused program to help manage gestational diabetes with personalized meal plans, expert tips, and emotional support.",
    features: [
      "Personalized meal plans",
      "Weekly glucose tracking",
      "Expert tips and exercises",
    ],
    href: site.ctas.whatsapp,
    external: true,
    cta: "Inquire on WhatsApp",
    tone: "cream",
  },
  {
    badge: "Self-paced",
    title: "Crash Courses",
    description:
      "Affordable, focused sessions on labor prep, postpartum care, and nutrition — with lifetime access.",
    features: [
      "Affordable, focused sessions",
      "Downloadable resources",
      "Flexible, self-paced learning",
    ],
    href: site.ctas.masterclass,
    external: true,
    cta: "Browse courses",
    tone: "cream",
  },
  {
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
    href: site.ctas.masterclass,
    external: true,
    cta: "Watch the free masterclass",
    tone: "purple",
  },
  {
    badge: "Library",
    title: "Free Resources",
    description:
      "A collection of free eBooks, checklists, and video tutorials to support moms during pregnancy and postpartum.",
    features: [
      "Free eBooks and guides",
      "Printable checklists",
      "Relaxation video tutorials",
    ],
    href: "/blog",
    cta: "Browse the library",
    tone: "rose",
  },
];

export default function Programs() {
  return (
    <section id="programs" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
            Programs &amp; Services
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-[var(--brand-purple-deep)]">
            Expert-led programs for every stage of motherhood.
          </h2>
          <p className="mt-4 text-[var(--brand-muted)] leading-relaxed">
            From fertility preparation to postpartum recovery — pick the path that meets
            you where you are.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <ProgramCard key={p.title} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgramCard(p: Program) {
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
          <span aria-hidden className="transition group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
