"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function BlogSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[blog/[slug] boundary]", error);
  }, [error]);
  return (
    <section className="mx-auto max-w-3xl px-6 lg:px-10 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-rose)] font-semibold">
        Something went wrong
      </p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl text-[var(--brand-purple-deep)]">
        This article isn&apos;t available right now.
      </h1>
      <p className="mt-4 text-[var(--brand-muted)]">
        Please try again in a moment or head back to the blog.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="rounded-full border border-[var(--brand-purple)]/20 px-5 py-2 text-sm font-semibold text-[var(--brand-purple)] hover:bg-[var(--brand-blush)]"
        >
          Try again
        </button>
        <Link
          href="../"
          className="rounded-full bg-[var(--brand-purple)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-purple-deep)]"
        >
          Back to blog
        </Link>
      </div>
    </section>
  );
}
