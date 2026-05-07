"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";

const faqs = [
  {
    q: "What is PregnaWell, and how can it help me?",
    a: "PregnaWell is a virtual health clinic specializing in fertility, pregnancy, and postpartum support. We provide expert-led programs, masterclasses, and resources to empower women throughout their motherhood journey — grounded in current evidence and delivered with warmth.",
  },
  {
    q: "Are your services available internationally?",
    a: "Yes. Every program and resource is delivered virtually, so you can join from anywhere in the world. Our community already includes women across the GCC, North America, Europe, and beyond.",
  },
  {
    q: "Can I access support during the programs?",
    a: "Absolutely. Each program includes direct access to our team for your questions, regular check-ins, and a private community of women going through the same season — so you're never doing this alone.",
  },
  {
    q: "Is the masterclass really free?",
    a: "Yes — the HPO Axis masterclass is free, on-demand, and requires no credit card. It's the best place to start if you want a foundation in fertility before committing to anything else.",
  },
  {
    q: "What does the Fertility Score tool actually measure?",
    a: "The Fertility Score is a 5-minute self-assessment that surfaces what your hormones, cycle, and lifestyle are telling you about your fertility — and what's most worth your attention next. It's not a diagnostic tool; it's a clarity tool.",
  },
  {
    q: "How is PregnaScan different from the website?",
    a: "PregnaScan is a separate app built for expecting parents — it turns your medical scans and labs into clear, week-by-week understanding. You can find it at pregnascan.app.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-6 lg:px-10 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
            FAQ
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-[var(--brand-purple-deep)]">
            Common questions, answered.
          </h2>
          <p className="mt-4 text-[var(--brand-muted)] leading-relaxed">
            Don&rsquo;t see your question? Reach out on WhatsApp and we&rsquo;ll get
            back to you personally.
          </p>
          <Link
            href={site.ctas.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            Message us on WhatsApp →
          </Link>
        </div>

        <div className="lg:col-span-8 divide-y divide-[var(--brand-purple)]/10 rounded-3xl bg-white ring-1 ring-[var(--brand-purple)]/10 shadow-[0_15px_40px_-30px_rgba(61,42,110,0.35)]">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-6 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                >
                  <span className="font-display text-lg text-[var(--brand-purple-deep)]">
                    {item.q}
                  </span>
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
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm leading-relaxed text-[var(--brand-muted)]">
                      {item.a}
                    </p>
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
