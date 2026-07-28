import Link from "next/link";
import { headers } from "next/headers";
import { getDict, localeFromPathname } from "@/lib/i18n";

export default async function BlogSlugNotFound() {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/en";
  const locale = localeFromPathname(pathname);
  const dict = getDict(locale);
  return (
    <section className="mx-auto max-w-3xl px-6 lg:px-10 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-rose)] font-semibold">
        404
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl text-[var(--brand-purple-deep)]">
        {dict.blog.empty.title}
      </h1>
      <p className="mt-4 text-[var(--brand-muted)]">{dict.blog.empty.body}</p>
      <Link
        href={`/${locale}/blog`}
        className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
      >
        <span aria-hidden className="arrow-end">←</span> {dict.blog.backAll}
      </Link>
    </section>
  );
}
