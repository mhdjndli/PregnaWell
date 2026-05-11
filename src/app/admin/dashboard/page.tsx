import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { formatDate, getAllPostsAdmin } from "@/lib/blog";
import { categoryLabel } from "@/lib/i18n";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAuthed())) redirect("/admin");
  let posts: Awaited<ReturnType<typeof getAllPostsAdmin>> = [];
  let error: string | null = null;
  try {
    posts = await getAllPostsAdmin();
  } catch (err) {
    error = (err as Error).message;
  }

  const counts = {
    total: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    draft: posts.filter((p) => p.status === "draft").length,
  };

  return (
    <AdminShell>
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-[var(--brand-purple-deep)]">Posts</h1>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">
            Manage every blog post. Drafts and scheduled posts are private until they
            go live.
          </p>
        </div>
        <Link href="/admin/posts/new" className="btn-primary">
          + New post
        </Link>
      </div>

      {error && (
        <div className="mt-8 rounded-2xl bg-red-50 p-5 text-sm text-red-800 ring-1 ring-red-100">
          <p className="font-semibold">Database not reachable</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-red-700/80">
            Add a Postgres plugin to your Railway service — it sets <code>DATABASE_URL</code>{" "}
            automatically.
          </p>
        </div>
      )}

      {!error && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Total" value={counts.total} />
          <Stat label="Published" value={counts.published} tone="purple" />
          <Stat label="Scheduled" value={counts.scheduled} tone="rose" />
          <Stat label="Drafts" value={counts.draft} tone="muted" />
        </div>
      )}

      <div className="mt-8 rounded-3xl bg-white ring-1 ring-[var(--brand-purple)]/10 overflow-hidden shadow-[0_15px_40px_-30px_rgba(61,42,110,0.35)]">
        {posts.length === 0 && !error ? (
          <div className="p-12 text-center">
            <p className="font-display text-xl text-[var(--brand-purple-deep)]">No posts yet.</p>
            <p className="mt-2 text-sm text-[var(--brand-muted)]">
              Click &ldquo;+ New post&rdquo; to publish your first article.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--brand-muted)] border-b border-[var(--brand-purple)]/10">
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Lang</th>
                <th className="px-4 py-4 font-semibold">Publish date</th>
                <th className="px-4 py-4 font-semibold">Category</th>
                <th className="px-4 py-4 font-semibold w-1"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-[var(--brand-purple)]/5 last:border-0 hover:bg-[var(--brand-blush)]/30">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/posts/${p.id}/edit`}
                      className="font-semibold text-[var(--brand-purple-deep)] hover:text-[var(--brand-rose)]"
                    >
                      {p.title}
                    </Link>
                    <div className="mt-0.5 text-xs text-[var(--brand-muted)] font-mono">/{p.slug}</div>
                  </td>
                  <td className="px-4 py-4"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-full bg-[var(--brand-blush)] px-2 py-0.5 text-xs font-mono font-semibold text-[var(--brand-rose)] uppercase">
                      {p.language}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[var(--brand-muted)]">{formatDate(p.publishAt, p.language) || "—"}</td>
                  <td className="px-4 py-4 text-[var(--brand-muted)]">{categoryLabel(p.category, p.language) ?? "—"}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/posts/${p.id}/edit`}
                      className="text-sm font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "purple" | "rose" | "muted";
}) {
  const toneClasses =
    tone === "purple"
      ? "bg-[var(--brand-purple-deep)] text-white"
      : tone === "rose"
      ? "bg-[var(--brand-blush)] text-[var(--brand-purple-deep)]"
      : tone === "muted"
      ? "bg-white text-[var(--brand-muted)]"
      : "bg-white text-[var(--brand-purple-deep)]";
  return (
    <div className={`rounded-2xl p-5 ring-1 ring-[var(--brand-purple)]/10 ${toneClasses}`}>
      <p className="text-xs uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "draft" | "scheduled" | "published" }) {
  const map = {
    draft: { label: "Draft", cls: "bg-zinc-100 text-zinc-700" },
    scheduled: { label: "Scheduled", cls: "bg-amber-100 text-amber-800" },
    published: { label: "Published", cls: "bg-emerald-100 text-emerald-800" },
  } as const;
  const m = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}>
      {m.label}
    </span>
  );
}
