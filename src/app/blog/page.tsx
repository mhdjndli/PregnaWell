import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { formatDate, getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Evidence-based articles on fertility, pregnancy, and postpartum from Maha Hommos and the PregnaWell team.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-rose-soft)]/30 blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl px-6 lg:px-10 pt-16 pb-10 lg:pt-24 lg:pb-14">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-rose)] font-semibold">
            The PregnaWell Blog
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-6xl text-[var(--brand-purple-deep)] max-w-3xl">
            Articles for women who want to understand their bodies.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--brand-muted)]">
            Plain-language explainers, field notes from clinic, and tools you can use
            this week.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {posts.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-[var(--brand-purple)]/10">
              <p className="font-display text-2xl text-[var(--brand-purple-deep)]">
                Articles are on the way.
              </p>
              <p className="mt-3 text-[var(--brand-muted)]">
                Our first posts go live shortly. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, idx) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className={`group rounded-3xl bg-white overflow-hidden ring-1 ring-[var(--brand-purple)]/10 hover:-translate-y-1 transition shadow-[0_15px_40px_-25px_rgba(61,42,110,0.35)] flex flex-col ${
                    idx === 0 ? "md:col-span-2 lg:col-span-2" : ""
                  }`}
                >
                  {post.cover && (
                    <div className={`relative w-full ${idx === 0 ? "h-72 md:h-96" : "h-52"}`}>
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        className="object-cover transition group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  )}
                  <div className="p-7 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-xs text-[var(--brand-muted)]">
                      {post.category && (
                        <span className="rounded-full bg-[var(--brand-blush)] px-3 py-1 font-semibold text-[var(--brand-rose)]">
                          {post.category}
                        </span>
                      )}
                      <span>{formatDate(post.date)}</span>
                      <span>· {post.readingMinutes} min read</span>
                    </div>
                    <h2
                      className={`mt-3 font-display text-[var(--brand-purple-deep)] ${
                        idx === 0 ? "text-2xl md:text-3xl" : "text-xl"
                      }`}
                    >
                      {post.title}
                    </h2>
                    <p className="mt-3 text-sm text-[var(--brand-muted)] leading-relaxed flex-1">
                      {post.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-purple)] group-hover:text-[var(--brand-rose)]">
                      Read article <span aria-hidden className="transition group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
