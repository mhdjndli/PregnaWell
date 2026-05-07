import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

const socials = [
  { label: "Instagram", href: site.social.instagram },
  { label: "Podcast", href: site.social.podcast },
  { label: "LinkedIn", href: site.social.linkedin },
  { label: "Facebook", href: site.social.facebook },
];

export default function Footer() {
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
            Compassionate, evidence-based guidance for women on their journey from
            fertility to motherhood.
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
            Explore
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/" className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]">
                Home
              </Link>
            </li>
            <li>
              <Link href="/story" className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]">
                Our Story
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]">
                Blog
              </Link>
            </li>
            <li>
              <a
                href={site.ctas.pregnaScan}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]"
              >
                PregnaScan App ↗
              </a>
            </li>
            <li>
              <a
                href={site.ctas.masterclass}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]"
              >
                Free Masterclass ↗
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--brand-purple)]">
            Follow
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand-ink)] hover:text-[var(--brand-rose)]"
                >
                  {s.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--brand-purple)]/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-[var(--brand-muted)]">
          <p>© {new Date().getFullYear()} PregnaWell Inc. All rights reserved.</p>
          <p>Made with care for moms-to-be everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
