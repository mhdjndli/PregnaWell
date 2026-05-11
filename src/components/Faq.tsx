"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";
import { getDict, type Locale } from "@/lib/i18n";

export default function Faq({ locale }: { locale: Locale }) {
  const dict = getDict(locale);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-6 lg:px-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
            {dict.faq.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-[var(--brand-purple-deep)]">
            {dict.faq.title}
          </h2>
          <p className="mt-4 text-[var(--brand-muted)] leading-relaxed">{dict.faq.helper}</p>
          <Link
            href={site.ctas.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            {dict.faq.contact}
          </Link>
        </div>

        <div className="lg:col-span-8 divide-y divide-[var(--brand-purple)]/10 rounded-3xl bg-white ring-1 ring-[var(--brand-purple)]/10 shadow-[0_15px_40px_-30px_rgba(61,42,110,0.35)]">
          {dict.faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-6 px-6 py-5 text-start"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                >
                  <span className="font-display text-lg text-[var(--brand-purple-deep)]">{item.q}</span>
                  <span
                    aria-hidden
                    className={`mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--brand-purple)] ring-1 ring-[var(--brand-purple)]/20 transition ${
                      isOpen ? "bg-[var(--brand-purple)] text-white" : "bg-white"
                    }`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className={`h-3 w-3 transition-transform ${isOpen ? "rotate-45" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M8 2v12M2 8h12" />
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-${i}`}
                  className={`grid overflow-hidden transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm leading-relaxed text-[var(--brand-muted)]">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
