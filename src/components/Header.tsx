"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { getDict, otherLocale, stripLocale, withLocale, type Locale } from "@/lib/i18n";

type Props = { locale: Locale };

const localeFlag: Record<Locale, string> = {
  en: "🇺🇸",
  ar: "🇸🇦",
};

export default function Header({ locale }: Props) {
  const dict = getDict(locale);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const nav: Array<{ href: string; label: string; key: string; external?: boolean }> = [
    { href: `/${locale}`, label: dict.nav.home, key: "home" },
    { href: `/${locale}/story`, label: dict.nav.story, key: "story" },
    { href: `/${locale}/blog`, label: dict.nav.blog, key: "blog" },
    { href: `/${locale}/testimonials`, label: dict.nav.testimonials, key: "testimonials" },
  ];

  const other = otherLocale(locale);
  // Articles exist in one language only; switching locale on an article
  // page goes to the other language's blog index instead of a redirect
  // bouncing straight back.
  const isArticlePage = /^\/(en|ar)\/blog\/.+/.test(pathname || "");
  const switchHref = isArticlePage
    ? `/${other}/blog`
    : withLocale(other, pathname || `/${locale}`);
  const langButtonLabel = `${localeFlag[other]} ${dict.language[other]}`;

  return (
    <header
      dir="ltr"
      className={`sticky top-0 z-40 w-full transition-all ${
        scrolled
          ? "bg-[var(--brand-cream)]/90 backdrop-blur-md shadow-[0_2px_20px_-12px_rgba(61,42,110,0.25)]"
          : "bg-[var(--brand-cream)]/70 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
        <Link href={`/${locale}`} aria-label="PregnaWell home" className="flex items-center gap-2">
          <Image
            src="/assets/logo-wordmark.png"
            alt="PregnaWell"
            width={170}
            height={40}
            priority
            className="h-9 w-auto md:h-10"
          />
        </Link>

        <nav
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="hidden md:flex items-center gap-1"
        >
          {nav.map((item) => {
            const itemPathStripped = item.external ? null : stripLocale(item.href);
            const currentStripped = stripLocale(pathname || "");
            const isActive = !item.external && itemPathStripped === currentStripped;
            return (
              <Link
                key={item.key}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className={`relative px-4 py-2 text-[15px] font-medium transition ${
                  isActive
                    ? "text-[var(--brand-purple)]"
                    : "text-[var(--brand-ink)] hover:text-[var(--brand-purple)]"
                }`}
              >
                {item.label}
                {item.external && (
                  <span aria-hidden className="arrow-up-end ms-1 text-xs opacity-70">↗</span>
                )}
                {isActive && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-[var(--brand-rose)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <a
            href={switchHref}
            aria-label={dict.language.switchLabel}
            className="inline-flex items-center gap-2 h-9 rounded-full border border-[var(--brand-purple)]/20 px-3 text-xs font-semibold text-[var(--brand-purple)] hover:bg-[var(--brand-blush)]"
          >
            <span aria-hidden className="inline-flex items-center text-base leading-none translate-y-[1px]">
              {localeFlag[other]}
            </span>
            <span className="leading-none">{dict.language[other]}</span>
          </a>
          <Link
            href={site.ctas.masterclass}
            target="_blank"
            rel="noopener noreferrer"
            dir={locale === "ar" ? "rtl" : "ltr"}
            className="btn-primary text-sm"
          >
            {dict.cta.masterclassShort}
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <a
            href={switchHref}
            aria-label={dict.language.switchLabel}
            className="inline-flex items-center gap-2 h-11 rounded-full border border-[var(--brand-purple)]/20 px-3 text-xs font-semibold text-[var(--brand-purple)] hover:bg-[var(--brand-blush)]"
          >
            <span aria-hidden className="inline-flex items-center text-base leading-none translate-y-[1px]">
              {localeFlag[other]}
            </span>
            <span className="leading-none">{dict.language[other]}</span>
          </a>
          <button
            aria-label="Toggle menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--brand-purple)]/20 text-[var(--brand-purple)]"
            onClick={() => setOpen((s) => !s)}
          >
            <span className="relative block h-3.5 w-5">
              <span
                className={`absolute start-0 top-0 h-0.5 w-full rounded-full bg-current transition ${
                  open ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`absolute start-0 top-1.5 h-0.5 w-full rounded-full bg-current transition ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute start-0 top-3 h-0.5 w-full rounded-full bg-current transition ${
                  open ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--brand-purple)]/10 bg-[var(--brand-cream)]">
          <div
            dir={locale === "ar" ? "rtl" : "ltr"}
            className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-1"
          >
            {nav.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="px-2 py-3 text-base font-medium text-[var(--brand-ink)] hover:text-[var(--brand-purple)]"
              >
                {item.label}
                {item.external && <span aria-hidden className="arrow-up-end ms-1 text-xs opacity-70">↗</span>}
              </Link>
            ))}
            <Link
              href={site.ctas.masterclass}
              target="_blank"
              rel="noopener noreferrer"
              dir={locale === "ar" ? "rtl" : "ltr"}
              className="btn-primary mt-3 w-full text-center"
            >
              {dict.cta.masterclassShort}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
