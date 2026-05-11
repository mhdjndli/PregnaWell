import { site } from "@/lib/site";
import { getDict, type Locale } from "@/lib/i18n";

export default function PressMarquee({ locale }: { locale: Locale }) {
  const dict = getDict(locale);
  const items = [...site.press, ...site.press];
  return (
    <section className="relative bg-white/60 border-y border-[var(--brand-purple)]/10 py-10 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
          {dict.press.eyebrow}
        </p>
        <div className="mt-6 relative">
          <div className="flex w-max animate-marquee gap-12 items-center">
            {items.map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="flex h-12 shrink-0 items-center px-4"
                aria-label={name}
              >
                <span className="font-display text-xl md:text-2xl font-medium text-[var(--brand-purple)]/70 whitespace-nowrap tracking-tight">
                  {name}
                </span>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 start-0 w-16 bg-gradient-to-r rtl:bg-gradient-to-l from-[var(--brand-cream)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 end-0 w-16 bg-gradient-to-l rtl:bg-gradient-to-r from-[var(--brand-cream)] to-transparent" />
        </div>
      </div>
    </section>
  );
}
