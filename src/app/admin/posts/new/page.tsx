import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import PostEditor from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  if (!(await isAuthed())) redirect("/admin");
  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-[var(--brand-purple-deep)]">New post</h1>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">
          Write the post, set publish options, and save.
        </p>
      </div>
      <PostEditor />
    </AdminShell>
  );
}
