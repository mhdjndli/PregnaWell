import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "The story behind PregnaWell — Maha Hommos's mission to give every woman the science, support, and softness she deserves on her journey to motherhood.",
};

export default function StoryPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-rose-soft)]/35 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-[360px] w-[360px] rounded-full bg-[var(--brand-purple-soft)]/25 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl px-6 lg:px-10 pt-16 pb-12 lg:pt-24 lg:pb-16 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-rose)] font-semibold">
            Our Story
          </p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl text-[var(--brand-purple-deep)]">
            Built from real motherhood, backed by real science.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-[var(--brand-muted)] leading-relaxed">
            PregnaWell began with one belief: every woman deserves to understand her own
            body before, during, and after pregnancy — without confusion, fear, or
            guesswork.
          </p>
        </div>
      </section>

      <section className="pb-12">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="relative rounded-[2rem] overflow-hidden ring-1 ring-[var(--brand-purple)]/10 shadow-[0_30px_80px_-30px_rgba(61,42,110,0.4)]">
            <Image
              src="/assets/maha-2.jpg"
              alt="Maha Hommos"
              width={1600}
              height={900}
              className="h-[420px] w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <article className="pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-10 prose-pregna">
          <h2>Meet Maha</h2>
          <p>
            Maha Hommos is a clinical dietitian, public-health advocate, and founder of
            PregnaWell. Over the last decade she has guided more than 50,000 women
            through the physical and emotional landscape of fertility, pregnancy, and
            postpartum — across the Middle East, Europe, and North America.
          </p>
          <p>
            Her work has been featured by Qatar Foundation, MBC Group, Rotana, Al Sharq,
            UAE Stories, Qatar TV, USA News, and Al Jazeera, and her social platforms
            reach millions of women each month with content that translates obstetric
            and endocrinology research into language anyone can act on.
          </p>

          <h2>Why PregnaWell exists</h2>
          <p>
            <em>(Founder copy to be finalized.)</em> Maha started PregnaWell after years
            of watching the same pattern: women arriving overwhelmed, under-informed,
            and unsupported — even with the best healthcare around them. PregnaWell is
            the bridge: between the clinic and the kitchen, between the lab work and
            the lived experience, between the textbook and the woman holding the
            test.
          </p>

          <blockquote>
            “I want every woman to feel the way she deserves to feel during the most
            important season of her life — informed, prepared, and softly supported.”
          </blockquote>

          <h2>What we believe</h2>
          <ul>
            <li>
              <strong>Science is the floor, not the ceiling.</strong> Every program is
              grounded in current evidence and updated when the evidence does.
            </li>
            <li>
              <strong>Education is medicine.</strong> Understanding your body is the
              single most underrated intervention in maternal health.
            </li>
            <li>
              <strong>Care should travel.</strong> Whether you&rsquo;re in Doha, Dubai,
              Toronto, or anywhere in between, you should be able to reach for help.
            </li>
          </ul>

          <h2>What&rsquo;s next</h2>
          <p>
            PregnaWell now spans a free masterclass, a fertility self-assessment, the
            PregnaScan App for expecting parents, and an ongoing library of articles
            and programs. Wherever you are on the journey, there&rsquo;s a door for you.
          </p>
        </div>
      </article>

      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-10 grid gap-4 sm:grid-cols-2">
          <Link
            href={site.ctas.masterclass}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-3xl bg-[var(--brand-purple-deep)] text-white p-8 hover:-translate-y-1 transition shadow-[0_20px_50px_-25px_rgba(61,42,110,0.5)]"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose-soft)] font-semibold">
              Start here
            </p>
            <h3 className="mt-2 font-display text-2xl">Watch the free masterclass</h3>
            <p className="mt-2 text-white/80 text-sm">
              60 minutes on the HPO axis, with no fluff and no pitch.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
              Watch now →
            </span>
          </Link>
          <Link
            href={site.ctas.fertilityScore}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-3xl bg-[var(--brand-blush)] text-[var(--brand-purple-deep)] p-8 hover:-translate-y-1 transition ring-1 ring-[var(--brand-rose-soft)]/40"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
              Or assess yourself
            </p>
            <h3 className="mt-2 font-display text-2xl">Check your fertility score</h3>
            <p className="mt-2 text-[var(--brand-purple)]/80 text-sm">
              A 5-minute self-assessment that surfaces what&rsquo;s actually moving the
              needle.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
              Take the assessment →
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
