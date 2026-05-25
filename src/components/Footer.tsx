import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { getDict, type Locale } from "@/lib/i18n";

const socials = [
  { key: "instagram", href: site.social.instagram },
  { key: "podcast", href: site.social.podcast },
  { key: "linkedin", href: site.social.linkedin },
  { key: "facebook", href: site.social.facebook },
] as const;

const socialLabels: Record<(typeof socials)[number]["key"], { en: string; ar: string }> = {
  instagram: { en: "Instagram", ar: "إنستغرام" },
  podcast: { en: "Podcast", ar: "بودكاست" },
  linkedin: { en: "LinkedIn", ar: "لينكدإن" },
  facebook: { en: "Facebook", ar: "فيسبوك" },
};

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDict(locale);
  return (
    <footer className="mt-24 border-t border-[var(--brand-purple)]/10 bg-[var(--brand-cream)]">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-14 grid gap-10 md:grid-cols-3">
        <div>
          <Image
            src="/assets/logo-wordmark.png"
            alt="PregnaWell"
            width={180}
            height={42}
            className="h-10 w-auto"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--brand-muted)]">
            {dict.footer.tagline}
          </p>
          <a
            href={`mailto:${site.email}`}
            className="mt-4 inline-block text-sm font-medium text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            {site.email}
          </a>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-purple)]">
            {dict.footer.explore}
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href={`/${locale}`} className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]">
                {dict.nav.home}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/story`} className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]">
                {dict.nav.story}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/blog`} className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]">
                {dict.nav.blog}
              </Link>
            </li>
            <li>
              <a
                href={site.ctas.pregnaScan}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]"
              >
                {dict.nav.pregnaScanApp} <span aria-hidden className="arrow-up-end">↗</span>
              </a>
            </li>
            <li>
              <a
                href={site.ctas.masterclass}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]"
              >
                {dict.cta.masterclass} <span aria-hidden className="arrow-up-end">↗</span>
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-purple)]">
            {dict.footer.follow}
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            {socials.map((s) => (
              <li key={s.key}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]"
                >
                  {socialLabels[s.key][locale]} <span aria-hidden className="arrow-up-end">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--brand-purple)]/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-[var(--brand-muted)]">
          <p>© {new Date().getFullYear()} PregnaWell Inc. {dict.footer.rights}</p>
          <p>{dict.footer.closing}</p>
        </div>
      </div>
    </footer>
  );
}
