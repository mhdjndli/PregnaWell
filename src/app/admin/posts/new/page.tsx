import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import PostEditor from "@/components/admin/PostEditor";
import { isLocale, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  if (!(await isAuthed())) redirect("/admin");
  const params = await searchParams;
  const lang: Locale = isLocale(params.lang ?? "") ? (params.lang as Locale) : "ar";
  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-[var(--brand-purple-deep)]">New post</h1>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">
          Write the post, set publish options, and save.
        </p>
      </div>
      <PostEditor defaultLanguage={lang} />
    </AdminShell>
  );
}
