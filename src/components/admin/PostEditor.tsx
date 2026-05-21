"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import RichEditor from "./RichEditor";
import {
  savePostAction,
  deletePostAction,
  uploadImageAction,
  generateCoverImageAction,
  generateSeoAction,
} from "@/app/admin/actions";
import type { BlogPost, BlogStatus } from "@/lib/blog";
import { categories, isCategoryId, type CategoryId, type Locale } from "@/lib/i18n";

type Props = {
  initial?: BlogPost | null;
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function PostEditor({ initial }: Props) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "Maha Hommos");
  const [language, setLanguage] = useState<Locale>(initial?.language ?? "en");
  const [category, setCategory] = useState<CategoryId | "">(
    isCategoryId(initial?.category) ? (initial!.category as CategoryId) : ""
  );
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [coverUrl, setCoverUrl] = useState(initial?.cover ?? "");
  const [coverImageId, setCoverImageId] = useState<string>(
    initial?.cover && initial.cover.startsWith("/api/images/")
      ? initial.cover.replace("/api/images/", "")
      : ""
  );
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [status, setStatus] = useState<BlogStatus>(initial?.status ?? "draft");
  const [publishAt, setPublishAt] = useState(toLocalInput(initial?.publishAt ?? ""));
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverGenerating, setCoverGenerating] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [seoNote, setSeoNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleCoverUpload(file: File) {
    setCoverError(null);
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadImageAction(fd);
      if (!res.ok || !res.url) {
        setCoverError(res.error ?? "Cover upload failed.");
        return;
      }
      setCoverImageId(res.id ?? "");
      setCoverUrl(res.url);
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleGenerateSeo() {
    setSeoError(null);
    setSeoNote(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setSeoError("Add a title first.");
      return;
    }
    const form = formRef.current;
    if (!form) return;
    const body = String(new FormData(form).get("body_md") ?? "").trim();
    if (!body) {
      setSeoError("Add some body content first.");
      return;
    }
    setSeoGenerating(true);
    try {
      const fd = new FormData();
      fd.set("title", trimmedTitle);
      fd.set("body_md", body);
      fd.set("language", language);
      const res = await generateSeoAction(fd);
      if (!res.ok) {
        setSeoError(res.error ?? "SEO generation failed.");
        return;
      }
      if (res.metaTitle) setMetaTitle(res.metaTitle);
      if (res.metaDescription) setMetaDescription(res.metaDescription);
      if (res.keywords && res.keywords.length > 0) setTags(res.keywords.join(", "));
      setSeoNote("Filled meta title, meta description, and tags from Gemini. Review before saving.");
    } finally {
      setSeoGenerating(false);
    }
  }

  async function handleGenerateCover() {
    setCoverError(null);
    const trimmed = title.trim();
    if (!trimmed) {
      setCoverError("Add a title before generating a cover.");
      return;
    }
    setCoverGenerating(true);
    try {
      const fd = new FormData();
      fd.set("title", trimmed);
      fd.set("language", language);
      const res = await generateCoverImageAction(fd);
      if (!res.ok || !res.url) {
        setCoverError(res.error ?? "Cover generation failed.");
        return;
      }
      setCoverImageId(res.id ?? "");
      setCoverUrl(res.url);
    } finally {
      setCoverGenerating(false);
    }
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setTopError(null);
    const fd = new FormData(e.currentTarget);
    if (initial?.id) fd.set("id", initial.id);
    fd.set("status", status);
    fd.set("publish_at", publishAt);
    fd.set("language", language);
    fd.set("category", category);
    fd.set("cover_image_id", coverImageId);
    fd.set("cover_url", coverImageId ? "" : coverUrl);
    startTransition(async () => {
      const res = await savePostAction(fd);
      if (res && !res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        if (res.error) setTopError(res.error);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 space-y-6">
        <Card>
          <Field label="Title" error={errors.title}>
            <input
              required
              name="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="The first 40 days postpartum"
              className={inputCls}
            />
          </Field>
          <Field label="Description" hint="Shown in post lists and meta description (if not overridden).">
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputCls}
              placeholder="A 1–2 sentence summary."
            />
          </Field>
        </Card>

        <Card>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)] mb-2">
            Body
          </label>
          <RichEditor
            name="body_md"
            initialValue={initial?.body_md ?? ""}
            language={language}
            uploadAction={uploadImageAction}
          />
          <p className="mt-2 text-xs text-[var(--brand-muted)]">
            What you type is exactly how it will appear on the site. Drop or paste images
            directly to upload.
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg text-[var(--brand-purple-deep)]">SEO</h3>
              <p className="mt-1 text-xs text-[var(--brand-muted)]">
                Override the title and description used by search engines and social previews.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateSeo}
              disabled={seoGenerating || !title.trim()}
              className="shrink-0 inline-flex items-center justify-center rounded-full border border-[var(--brand-purple)]/30 bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-purple)] hover:bg-[var(--brand-blush)] disabled:cursor-not-allowed disabled:opacity-50"
              title={!title.trim() ? "Add a title first" : "Generate meta title, description, and tags using Gemini"}
            >
              {seoGenerating ? "Generating…" : "Generate SEO settings"}
            </button>
          </div>
          {seoError && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {seoError}
            </p>
          )}
          {seoNote && !seoError && (
            <p className="mt-3 rounded-xl bg-[var(--brand-blush)]/60 px-3 py-2 text-sm text-[var(--brand-purple-deep)] ring-1 ring-[var(--brand-purple)]/15">
              {seoNote}
            </p>
          )}
          <div className="mt-4 space-y-4">
            <Field label="Meta title" hint="Optional, defaults to the post title.">
              <input
                name="meta_title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title || "(uses post title)"}
                className={inputCls}
              />
            </Field>
            <Field label="Meta description" hint="Optional, defaults to the description above.">
              <textarea
                name="meta_description"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                placeholder={description || "(uses description)"}
                className={inputCls}
              />
            </Field>
          </div>
        </Card>
      </div>

      <aside className="lg:col-span-4 space-y-6">
        <Card>
          <h3 className="font-display text-lg text-[var(--brand-purple-deep)]">Publish</h3>
          <div className="mt-4 space-y-3">
            <RadioOption
              checked={status === "draft"}
              onChange={() => setStatus("draft")}
              label="Draft"
              description="Hidden from the site."
            />
            <RadioOption
              checked={status === "published"}
              onChange={() => setStatus("published")}
              label="Published"
              description="Live immediately."
            />
            <RadioOption
              checked={status === "scheduled"}
              onChange={() => setStatus("scheduled")}
              label="Scheduled"
              description="Goes live at the date below."
            />
          </div>

          {(status === "scheduled" || status === "published") && (
            <Field
              label={status === "scheduled" ? "Publish at" : "Publish date (shown on post)"}
              hint={
                status === "scheduled"
                  ? "Visible on the site once this date passes."
                  : "Optional, leave blank to use right now."
              }
            >
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className={inputCls}
              />
            </Field>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create post"}
            </button>
            <Link href="/admin/dashboard" className="text-center text-sm text-[var(--brand-muted)] hover:text-[var(--brand-purple)]">
              Cancel
            </Link>
          </div>

          {topError && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {topError}
            </p>
          )}
        </Card>

        <Card>
          <h3 className="font-display text-lg text-[var(--brand-purple-deep)]">Slug</h3>
          <Field label="URL" error={errors.slug} hint={`pregnawell.com/blog/${slug || "your-slug"}`}>
            <input
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="post-slug"
              className={inputCls}
            />
          </Field>
        </Card>

        <Card>
          <h3 className="font-display text-lg text-[var(--brand-purple-deep)]">Cover image</h3>
          {coverUrl ? (
            <div className="mt-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl ring-1 ring-[var(--brand-purple)]/10">
                <Image
                  src={coverUrl}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  unoptimized={coverUrl.startsWith("/api/images/")}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setCoverUrl("");
                  setCoverImageId("");
                }}
                className="mt-3 text-sm text-red-600 hover:text-red-800"
              >
                Remove cover
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--brand-muted)]">No cover image yet.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-dashed border-[var(--brand-purple)]/30 px-4 py-2 text-sm font-semibold text-[var(--brand-purple)] hover:bg-[var(--brand-blush)]">
              {coverUploading ? "Uploading…" : coverUrl ? "Replace cover" : "Upload cover"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCoverUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={handleGenerateCover}
              disabled={coverGenerating || coverUploading || !title.trim()}
              className="inline-flex items-center justify-center rounded-full border border-[var(--brand-purple)]/30 bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-purple)] hover:bg-[var(--brand-blush)] disabled:cursor-not-allowed disabled:opacity-50"
              title={!title.trim() ? "Add a title first" : "Generate a cover from the title using Gemini"}
            >
              {coverGenerating ? "Generating…" : "Generate with Gemini"}
            </button>
          </div>
          {coverError && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {coverError}
            </p>
          )}
        </Card>

        <Card>
          <h3 className="font-display text-lg text-[var(--brand-purple-deep)]">Language</h3>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">
            Posts only appear on the blog matching their language.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <LangButton
              active={language === "en"}
              onClick={() => setLanguage("en")}
              label="English"
              hint="/en/blog"
            />
            <LangButton
              active={language === "ar"}
              onClick={() => setLanguage("ar")}
              label="العربية"
              hint="/ar/blog"
            />
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg text-[var(--brand-purple-deep)]">Category</h3>
          <p className="mt-1 text-xs text-[var(--brand-muted)]">Pick one. Optional.</p>
          <div className="mt-3 space-y-2">
            <CategoryChoice
              checked={category === ""}
              onClick={() => setCategory("")}
              label="None"
              labelAr=""
            />
            {categories.map((c) => (
              <CategoryChoice
                key={c.id}
                checked={category === c.id}
                onClick={() => setCategory(c.id)}
                label={c.en}
                labelAr={c.ar}
              />
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg text-[var(--brand-purple-deep)]">Tags &amp; author</h3>
          <div className="mt-3 space-y-3">
            <Field label="Tags" hint="Comma-separated.">
              <input
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="hpo-axis, fertility, hormones"
                className={inputCls}
              />
            </Field>
            <Field label="Author">
              <input
                name="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </Card>

        {isEdit && initial?.id && (
          <Card>
            <h3 className="font-display text-lg text-red-700">Danger zone</h3>
            <p className="mt-2 text-sm text-[var(--brand-muted)]">
              Permanently delete this post. This cannot be undone.
            </p>
            <DeleteButton id={initial.id} />
          </Card>
        )}
      </aside>
    </form>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <form
      action={(fd) => {
        if (!confirm("Permanently delete this post? This cannot be undone.")) return;
        fd.set("id", id);
        startTransition(async () => {
          await deletePostAction(fd);
        });
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="mt-3 inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Delete post"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--brand-purple)]/15 bg-white px-3.5 py-2.5 text-sm text-[var(--brand-ink)] outline-none focus:border-[var(--brand-purple)] focus:ring-4 focus:ring-[var(--brand-purple)]/10";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-[var(--brand-purple)]/10 shadow-[0_15px_40px_-30px_rgba(61,42,110,0.3)]">
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--brand-muted)] mb-1.5">
        {label}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-[var(--brand-muted)]">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  );
}

function LangButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-3 text-center ring-1 transition ${
        active
          ? "bg-[var(--brand-purple-deep)] ring-[var(--brand-purple-deep)] text-white"
          : "bg-white ring-[var(--brand-purple)]/15 text-[var(--brand-ink)] hover:ring-[var(--brand-purple)]/40"
      }`}
    >
      <div className="font-semibold text-sm">{label}</div>
      <div className={`mt-0.5 text-[11px] font-mono ${active ? "text-white/70" : "text-[var(--brand-muted)]"}`}>
        {hint}
      </div>
    </button>
  );
}

function CategoryChoice({
  checked,
  onClick,
  label,
  labelAr,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
  labelAr: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-start ring-1 transition ${
        checked
          ? "bg-[var(--brand-blush)] ring-[var(--brand-rose)] text-[var(--brand-purple-deep)]"
          : "bg-white ring-[var(--brand-purple)]/10 text-[var(--brand-ink)] hover:ring-[var(--brand-purple)]/30"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className={`inline-block h-3 w-3 rounded-full ring-2 ring-current ${checked ? "bg-current" : ""}`} />
        <span className="font-semibold text-sm">{label}</span>
      </span>
      {labelAr && <span dir="rtl" className="text-sm text-[var(--brand-muted)]">{labelAr}</span>}
    </button>
  );
}

function RadioOption({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full text-left rounded-xl px-4 py-3 ring-1 transition ${
        checked
          ? "bg-[var(--brand-blush)] ring-[var(--brand-rose)] text-[var(--brand-purple-deep)]"
          : "bg-white ring-[var(--brand-purple)]/10 text-[var(--brand-ink)] hover:ring-[var(--brand-purple)]/30"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full ring-2 ring-current ${checked ? "bg-current" : ""}`}
        />
        <span className="font-semibold text-sm">{label}</span>
      </div>
      <p className="mt-0.5 ml-5.5 text-xs text-[var(--brand-muted)]">{description}</p>
    </button>
  );
}
