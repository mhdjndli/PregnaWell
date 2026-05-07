import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import PressMarquee from "@/components/PressMarquee";
import Programs from "@/components/Programs";
import Testimonials from "@/components/Testimonials";
import Faq from "@/components/Faq";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -right-24 h-[480px] w-[480px] rounded-full bg-[var(--brand-rose-soft)]/40 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-purple-soft)]/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-16 pb-20 lg:pt-24 lg:pb-28 grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-rose)] ring-1 ring-[var(--brand-rose-soft)]/50">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-rose)]" />
              PregnaWell · with Maha Hommos
            </span>
            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-[var(--brand-purple-deep)]">
              Empowering women on their journey to <em className="not-italic text-[var(--brand-rose)]">motherhood</em>.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[var(--brand-muted)] leading-relaxed">
              From fertility to postpartum, our expert-led programs and resources are
              here to guide you with science, compassion, and real-world wisdom — every
              step of the way.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href={site.ctas.masterclass}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Watch a Free Masterclass
                <span aria-hidden>→</span>
              </Link>
              <Link
                href={site.ctas.fertilityScore}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Check Your Fertility Score
              </Link>
            </div>

            <p className="mt-5 text-sm text-[var(--brand-muted)]">
              Free 60-minute masterclass on the HPO axis · No credit card required
            </p>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-xl">
              <Stat value="10M+" label="Video views" />
              <Stat value="50K+" label="Mothers supported" />
              <Stat value="300K+" label="Instagram followers" />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[var(--brand-rose-soft)]/60 via-white to-[var(--brand-purple-soft)]/40 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] ring-1 ring-[var(--brand-purple)]/10 shadow-[0_30px_80px_-30px_rgba(61,42,110,0.45)]">
                <Image
                  src="/assets/maha-1.jpg"
                  alt="Maha Hommos, founder of PregnaWell"
                  width={900}
                  height={1100}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white/95 backdrop-blur p-4 shadow-xl ring-1 ring-[var(--brand-purple)]/10 max-w-[220px]">
                <p className="font-display text-base text-[var(--brand-purple-deep)]">
                  &ldquo;Science-backed care, delivered with warmth.&rdquo;
                </p>
                <p className="mt-1 text-xs text-[var(--brand-muted)]">— Maha Hommos, Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PressMarquee />

      {/* Why PregnaWell */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose)] font-semibold">
            Why PregnaWell
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl text-[var(--brand-purple-deep)]">
            Compassionate, evidence-based care for every mom-to-be.
          </h2>
          <p className="mt-5 max-w-2xl mx-auto text-[var(--brand-muted)] leading-relaxed">
            Maha Hommos blends clinical nutrition expertise with a decade of helping
            women understand their bodies, hormones, and choices — building the tools
            you actually need.
          </p>
        </div>
      </section>

      <Programs />

      <Testimonials />

      <Faq />

      {/* Featured CTA bands */}
      <section className="pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 grid gap-6 lg:grid-cols-2">
          <CtaCard
            kicker="Free Masterclass"
            title="Watch a Free Masterclass about the HPO Axis"
            body="60 minutes that change how you think about fertility. Streaming on demand."
            href={site.ctas.masterclass}
            cta="Watch now"
            tone="purple"
          />
          <CtaCard
            kicker="Self-Assessment"
            title="Check Your Fertility Score"
            body="Find out what your hormones, cycle, and lifestyle are telling you — in five minutes."
            href={site.ctas.fertilityScore}
            cta="Take the assessment"
            tone="rose"
          />
        </div>
      </section>

      {/* Founder strip */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="overflow-hidden rounded-[2rem] bg-[var(--brand-purple-deep)] text-white shadow-[0_30px_60px_-30px_rgba(61,42,110,0.55)] grid lg:grid-cols-12 items-stretch">
            <div className="relative lg:col-span-5 min-h-[320px]">
              <Image
                src="/assets/maha-2.jpg"
                alt="Maha Hommos at work"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
            <div className="lg:col-span-7 p-8 lg:p-14">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose-soft)] font-semibold">
                Meet your guide
              </p>
              <h2 className="mt-3 font-display text-3xl md:text-4xl">
                Hi, I&rsquo;m Maha Hommos.
              </h2>
              <p className="mt-4 text-white/85 leading-relaxed">
                Clinical dietitian, mother, and founder of PregnaWell. For over a decade
                I&rsquo;ve helped women decode their bodies — from PCOS and gestational
                diabetes to postpartum recovery. PregnaWell is the playbook I wish every
                mom-to-be had.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/story" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--brand-purple-deep)] hover:bg-[var(--brand-blush)] transition">
                  Read my story
                </Link>
                <Link
                  href={site.ctas.masterclass}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10"
                >
                  Watch the masterclass ↗
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl text-[var(--brand-purple-deep)]">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-[var(--brand-muted)]">{label}</p>
    </div>
  );
}

function CtaCard({
  kicker,
  title,
  body,
  href,
  cta,
  tone,
}: {
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  tone: "purple" | "rose";
}) {
  const isPurple = tone === "purple";
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative overflow-hidden rounded-3xl p-8 lg:p-10 ring-1 transition ${
        isPurple
          ? "bg-[var(--brand-purple-deep)] text-white ring-[var(--brand-purple-deep)]"
          : "bg-[var(--brand-blush)] text-[var(--brand-purple-deep)] ring-[var(--brand-rose-soft)]/40"
      } hover:-translate-y-1`}
    >
      <div
        className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-2xl"
        style={{ background: isPurple ? "var(--brand-rose-soft)" : "var(--brand-purple-soft)" }}
      />
      <p className={`text-xs uppercase tracking-[0.25em] font-semibold ${isPurple ? "text-[var(--brand-rose-soft)]" : "text-[var(--brand-rose)]"}`}>
        {kicker}
      </p>
      <h3 className="mt-3 font-display text-2xl md:text-3xl max-w-md">{title}</h3>
      <p className={`mt-3 max-w-md leading-relaxed ${isPurple ? "text-white/85" : "text-[var(--brand-purple)]/80"}`}>
        {body}
      </p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
        {cta} <span aria-hidden className="transition group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
