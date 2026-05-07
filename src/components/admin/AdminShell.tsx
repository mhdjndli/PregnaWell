import Link from "next/link";
import Image from "next/image";
import { logoutAction } from "@/app/admin/actions";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[var(--brand-purple)]/10">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <Image
              src="/assets/logo-mark.png"
              alt="PregnaWell"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-display text-lg text-[var(--brand-purple-deep)]">
              PregnaWell <span className="text-[var(--brand-rose)]">Admin</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/dashboard"
              className="text-[var(--brand-ink)] hover:text-[var(--brand-purple)]"
            >
              Posts
            </Link>
            <Link
              href="/admin/posts/new"
              className="rounded-full bg-[var(--brand-purple)] text-white px-4 py-2 hover:bg-[var(--brand-purple-deep)] transition"
            >
              + New post
            </Link>
            <Link
              href="/"
              target="_blank"
              className="text-[var(--brand-muted)] hover:text-[var(--brand-purple)]"
            >
              View site ↗
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full px-3 py-2 text-sm text-[var(--brand-muted)] hover:text-[var(--brand-purple)]"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-6 lg:px-8 py-10 flex-1">{children}</div>
    </div>
  );
}
