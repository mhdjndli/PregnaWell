"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { marked } from "marked";
import TurndownService from "turndown";
import type { Locale } from "@/lib/i18n";

type Props = {
  name: string;
  initialValue?: string;
  language: Locale;
  uploadAction: (formData: FormData) => Promise<{
    ok: boolean;
    url?: string;
    error?: string;
  }>;
};

function markdownToHtml(md: string): string {
  if (!md) return "";
  try {
    return marked.parse(md, { async: false }) as string;
  } catch {
    return md;
  }
}

function makeTurndown() {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
  });
  // Keep <img> as proper markdown image
  td.addRule("image", {
    filter: "img",
    replacement: (_content, node) => {
      const el = node as unknown as HTMLImageElement;
      const alt = el.getAttribute("alt") ?? "";
      const src = el.getAttribute("src") ?? "";
      return src ? `![${alt}](${src})` : "";
    },
  });
  return td;
}

export default function RichEditor({ name, initialValue = "", language, uploadAction }: Props) {
  const [markdown, setMarkdown] = useState(initialValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const turndown = useMemo(() => makeTurndown(), []);
  const initialHtml = useMemo(() => markdownToHtml(initialValue), [initialValue]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder:
          language === "ar"
            ? "ابدئي الكتابة هنا… اسحبي صورة أو ألصقيها لرفعها مباشرة."
            : "Write your post here… drop or paste an image to upload it directly.",
      }),
    ],
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap prose-pregna max-w-none px-5 py-5 min-h-[420px] outline-none focus:outline-none",
        dir: language === "ar" ? "rtl" : "ltr",
        spellcheck: "true",
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find((f) =>
          f.type.startsWith("image/")
        );
        if (file) {
          event.preventDefault();
          handleFile(file);
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const file = (event as DragEvent).dataTransfer?.files?.[0];
        if (file?.type.startsWith("image/")) {
          event.preventDefault();
          handleFile(file);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const md = turndown.turndown(html);
      setMarkdown(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    // sync if initialValue changes (e.g., navigating between posts)
    if (markdownToHtml(initialValue) !== editor.getHTML()) {
      editor.commands.setContent(markdownToHtml(initialValue));
      setMarkdown(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  async function handleFile(file: File) {
    if (!editor) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadAction(fd);
      if (!res.ok || !res.url) {
        setError(res.error ?? "Upload failed.");
        return;
      }
      const alt = file.name.replace(/\.[a-z0-9]+$/i, "");
      editor.chain().focus().setImage({ src: res.url, alt }).run();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl ring-1 ring-[var(--brand-purple)]/15 bg-white overflow-hidden">
      {/* Hidden value, what the form actually submits */}
      <input type="hidden" name={name} value={markdown} />

      <Toolbar
        editor={editor}
        onUploadClick={() => fileRef.current?.click()}
        uploading={uploading}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <EditorContent editor={editor} />
      {error && (
        <p className="border-t border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}

function Toolbar({
  editor,
  onUploadClick,
  uploading,
}: {
  editor: Editor | null;
  onUploadClick: () => void;
  uploading: boolean;
}) {
  if (!editor) {
    return (
      <div className="h-10 border-b border-[var(--brand-purple)]/10 bg-[var(--brand-blush)]/40" />
    );
  }
  return (
    <div className="flex items-center gap-1 flex-wrap border-b border-[var(--brand-purple)]/10 px-2 py-1.5 bg-[var(--brand-blush)]/40">
      <ToolBtn
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl/Cmd+B)"
      >
        <span className="font-bold">B</span>
      </ToolBtn>
      <ToolBtn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl/Cmd+I)"
      >
        <span className="italic">I</span>
      </ToolBtn>
      <Sep />
      <ToolBtn
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Section heading"
      >
        H2
      </ToolBtn>
      <ToolBtn
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Subheading"
      >
        H3
      </ToolBtn>
      <Sep />
      <ToolBtn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bulleted list"
      >
        • List
      </ToolBtn>
      <ToolBtn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        1. List
      </ToolBtn>
      <ToolBtn
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Quote block"
      >
        ❝ Quote
      </ToolBtn>
      <Sep />
      <ToolBtn
        active={editor.isActive("link")}
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = prompt("Link URL:", prev ?? "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}
        title="Insert link"
      >
        🔗 Link
      </ToolBtn>
      <ToolBtn onClick={onUploadClick} title="Upload image" disabled={uploading}>
        {uploading ? "Uploading…" : "🖼 Image"}
      </ToolBtn>
      <Sep />
      <ToolBtn
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo (Ctrl/Cmd+Z)"
        disabled={!editor.can().undo()}
      >
        ↶
      </ToolBtn>
      <ToolBtn
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
        disabled={!editor.can().redo()}
      >
        ↷
      </ToolBtn>
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  title,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`rounded-md px-2.5 py-1.5 text-sm transition disabled:opacity-40 ${
        active
          ? "bg-[var(--brand-purple)] text-white"
          : "text-[var(--brand-ink)] hover:bg-white hover:text-[var(--brand-purple)]"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-[var(--brand-purple)]/15" />;
}
