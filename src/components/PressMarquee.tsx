import { site } from "@/lib/site";

export default function PressMarquee() {
  const items = [...site.press, ...site.press];
  return (
    <section className="relative bg-white/60 border-y border-[var(--brand-purple)]/10 py-10 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
          As Appeared On
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
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--brand-cream)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--brand-cream)] to-transparent" />
        </div>
      </div>
    </section>
  );
}
