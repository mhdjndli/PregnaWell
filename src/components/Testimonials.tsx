import { getDict, type Locale } from "@/lib/i18n";

export default function Testimonials({ locale }: { locale: Locale }) {
  const dict = getDict(locale);
  return (
    <section className="relative py-20 lg:py-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[var(--brand-blush)]/40 to-transparent" />
      </div>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
            {dict.testimonials.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-[var(--brand-purple-deep)]">
            {dict.testimonials.title}
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dict.testimonials.items.map((t) => (
            <figure
              key={t.name}
              className="group rounded-3xl bg-white p-7 ring-1 ring-[var(--brand-purple)]/10 shadow-[0_15px_40px_-30px_rgba(61,42,110,0.35)] hover:-translate-y-1 transition"
            >
              <svg
                viewBox="0 0 32 32"
                aria-hidden
                className="h-7 w-7 text-[var(--brand-rose-soft)]"
                fill="currentColor"
              >
                <path d="M9.4 7.7C5.6 9.5 3 13.6 3 18v6.5h8.4V16H6.7c.2-2.5 1.6-4.4 4-5.5l-1.3-2.8zm14 0c-3.7 1.8-6.4 5.9-6.4 10.3v6.5h8.4V16H21c.2-2.5 1.6-4.4 4-5.5l-1.6-2.8z" />
              </svg>
              <blockquote className="mt-4 font-display text-lg leading-snug text-[var(--brand-purple-deep)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="font-semibold text-[var(--brand-ink)]">{t.name}</span>
                <span className="text-[var(--brand-muted)]"> · {t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
