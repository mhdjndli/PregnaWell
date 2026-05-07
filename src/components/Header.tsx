"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/site";

export default function Header() {
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

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all ${
        scrolled
          ? "bg-[var(--brand-cream)]/90 backdrop-blur-md shadow-[0_2px_20px_-12px_rgba(61,42,110,0.25)]"
          : "bg-[var(--brand-cream)]/70 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="/" aria-label="PregnaWell home" className="flex items-center gap-2">
          <Image
            src="/assets/logo-wordmark.png"
            alt="PregnaWell"
            width={170}
            height={40}
            priority
            className="h-9 w-auto md:h-10"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => {
            const isActive = !item.external && pathname === item.href;
            return (
              <Link
                key={item.href}
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
                  <span aria-hidden className="ml-1 text-xs opacity-70">↗</span>
                )}
                {isActive && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-[var(--brand-rose)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href={site.ctas.masterclass}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm"
          >
            Watch the Free Masterclass
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--brand-purple)]/20 text-[var(--brand-purple)]"
          onClick={() => setOpen((s) => !s)}
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-full rounded-full bg-current transition ${
                open ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 h-0.5 w-full rounded-full bg-current transition ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-3 h-0.5 w-full rounded-full bg-current transition ${
                open ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--brand-purple)]/10 bg-[var(--brand-cream)]">
          <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                className="px-2 py-3 text-base font-medium text-[var(--brand-ink)] hover:text-[var(--brand-purple)]"
              >
                {item.label}
                {item.external && <span className="ml-1 text-xs opacity-70">↗</span>}
              </Link>
            ))}
            <Link
              href={site.ctas.masterclass}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-3 w-full"
            >
              Watch the Free Masterclass
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
