"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";

const NAV = [
  {
    href: "/admin/dashboard",
    label: "Blog",
    match: (p: string) => p.startsWith("/admin/dashboard") || p.startsWith("/admin/posts"),
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4.5 w-4.5">
        <path d="M4 3.5h12a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" />
        <path d="M6.5 7h7M6.5 10h7M6.5 13h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/search-console",
    label: "Search Console",
    match: (p: string) => p.startsWith("/admin/search-console"),
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4.5 w-4.5">
        <circle cx="9" cy="9" r="5.5" />
        <path d="m13.5 13.5 3 3" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:sticky md:top-0 md:h-screen md:w-60 shrink-0 bg-white border-b md:border-b-0 md:border-r border-[var(--brand-purple)]/10 flex flex-col">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3 px-4 md:px-6 h-14 md:h-16 border-b border-[var(--brand-purple)]/10"
        >
          <Image
            src="/assets/logo-mark.png"
            alt="PregnaWell"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="font-display text-base whitespace-nowrap text-[var(--brand-purple-deep)]">
            PregnaWell <span className="text-[var(--brand-rose)]">Admin</span>
          </span>
        </Link>

        <nav className="flex md:flex-col items-center md:items-stretch gap-1 px-3 py-2 md:py-0 md:pt-5 overflow-x-auto md:overflow-visible md:flex-1">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 md:py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--brand-purple)] text-white"
                    : "text-[var(--brand-ink)] hover:bg-[var(--brand-blush)]/60 hover:text-[var(--brand-purple)]"
                }`}
              >
                {item.icon}
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/admin/posts/new"
            className="ms-auto md:ms-0 md:mt-4 flex items-center justify-center gap-2 rounded-full bg-[var(--brand-purple)] text-white px-4 py-2 text-sm font-semibold hover:bg-[var(--brand-purple-deep)] transition whitespace-nowrap"
          >
            + New post
          </Link>
        </nav>

        <div className="flex md:flex-col items-center md:items-stretch gap-1 px-3 pb-2 md:pb-5 md:pt-3 border-t border-[var(--brand-purple)]/10 md:border-t">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[var(--brand-muted)] hover:bg-[var(--brand-blush)]/60 hover:text-[var(--brand-purple)] whitespace-nowrap"
          >
            View site ↗
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[var(--brand-muted)] hover:bg-[var(--brand-blush)]/60 hover:text-[var(--brand-purple)] whitespace-nowrap"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="mx-auto w-full max-w-6xl px-6 lg:px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
