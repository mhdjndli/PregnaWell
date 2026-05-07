import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDate, getAllSlugs, getPost } from "@/lib/blog";
import { site } from "@/lib/site";

type Params = { slug: string };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: post.cover ? [post.cover] : undefined,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage(
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="pb-24">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-[var(--brand-rose-soft)]/25 blur-3xl" />
        </div>
        <div className="mx-auto max-w-3xl px-6 lg:px-10 pt-12 lg:pt-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            <span aria-hidden>←</span> All articles
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-[var(--brand-muted)]">
            {post.category && (
              <span className="rounded-full bg-[var(--brand-blush)] px-3 py-1 font-semibold text-[var(--brand-rose)]">
                {post.category}
              </span>
            )}
            <span>{formatDate(post.date)}</span>
            <span>· {post.readingMinutes} min read</span>
            {post.author && <span>· by {post.author}</span>}
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-5xl text-[var(--brand-purple-deep)] leading-[1.1]">
            {post.title}
          </h1>
          <p className="mt-5 text-lg text-[var(--brand-muted)] leading-relaxed">
            {post.description}
          </p>
        </div>
      </header>

      {post.cover && (
        <div className="mx-auto max-w-5xl px-6 lg:px-10 mt-12">
          <div className="overflow-hidden rounded-[2rem] ring-1 ring-[var(--brand-purple)]/10 shadow-[0_30px_80px_-30px_rgba(61,42,110,0.4)]">
            <Image
              src={post.cover}
              alt={post.title}
              width={1600}
              height={900}
              className="h-[420px] w-full object-cover"
              priority
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-6 lg:px-10 mt-12">
        <div
          className="prose-pregna"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="mx-auto max-w-3xl px-6 lg:px-10 mt-10 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white ring-1 ring-[var(--brand-purple)]/10 px-3 py-1 text-xs text-[var(--brand-muted)]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-3xl px-6 lg:px-10 mt-16">
        <div className="rounded-3xl bg-[var(--brand-purple-deep)] text-white p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--brand-rose-soft)] font-semibold">
            Keep going
          </p>
          <h3 className="mt-2 font-display text-2xl">
            Watch the free masterclass on the HPO axis
          </h3>
          <p className="mt-3 text-white/85">
            60 minutes that change how you think about fertility — built on the same
            framework we use in clinic.
          </p>
          <Link
            href={site.ctas.masterclass}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--brand-purple-deep)] hover:bg-[var(--brand-blush)] transition"
          >
            Watch now ↗
          </Link>
        </div>
      </div>
    </article>
  );
}
