import { notFound, redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import PostEditor from "@/components/admin/PostEditor";
import { getPostByIdAdmin } from "@/lib/blog";

export const dynamic = "force-dynamic";

export default async function EditPostPage(
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) redirect("/admin");
  const { id } = await params;
  const post = await getPostByIdAdmin(id);
  if (!post) notFound();

  return (
    <AdminShell>
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-[var(--brand-purple-deep)]">Edit post</h1>
          <p className="mt-1 text-sm text-[var(--brand-muted)] font-mono">/{post.slug}</p>
        </div>
        {post.status === "published" && (
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[var(--brand-purple)] hover:text-[var(--brand-rose)]"
          >
            View live post ↗
          </a>
        )}
      </div>
      <PostEditor initial={post} />
    </AdminShell>
  );
}
