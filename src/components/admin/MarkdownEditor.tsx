"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";

type Props = {
  name: string;
  initialValue?: string;
  uploadAction: (formData: FormData) => Promise<{
    ok: boolean;
    url?: string;
    error?: string;
  }>;
};

export default function MarkdownEditor({ name, initialValue = "", uploadAction }: Props) {
  const [value, setValue] = useState(initialValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const previewHtml = useMemo(() => {
    return marked.parse(value, { async: false }) as string;
  }, [value]);

  useEffect(() => {
    setValue(initialValue);
    // we intentionally only reset when initialValue identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  function wrapSelection(before: string, after: string = before) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    const next = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, end + before.length);
    });
  }

  function insertAtCursor(text: string) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = ta.value.slice(0, start) + text + ta.value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + text.length, start + text.length);
    });
  }

  function prefixLines(prefix: string) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = ta.value.lastIndexOf("\n", start - 1) + 1;
    const block = ta.value.slice(lineStart, end);
    const newBlock = block
      .split("\n")
      .map((l) => (l.startsWith(prefix) ? l : prefix + l))
      .join("\n");
    const next = ta.value.slice(0, lineStart) + newBlock + ta.value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(lineStart, lineStart + newBlock.length);
    });
  }

  async function handleFile(file: File) {
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
      insertAtCursor(`\n\n![${alt}](${res.url})\n\n`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl ring-1 ring-[var(--brand-purple)]/15 bg-white overflow-hidden">
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center justify-between gap-2 border-b border-[var(--brand-purple)]/10 px-2 py-1.5 bg-[var(--brand-blush)]/40">
        <div className="flex items-center gap-1 flex-wrap">
          <ToolbarButton onClick={() => wrapSelection("**")} title="Bold (Ctrl/Cmd+B)">
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton onClick={() => wrapSelection("*")} title="Italic">
            <span className="italic">I</span>
          </ToolbarButton>
          <Sep />
          <ToolbarButton onClick={() => prefixLines("## ")} title="Heading 2">
            H2
          </ToolbarButton>
          <ToolbarButton onClick={() => prefixLines("### ")} title="Heading 3">
            H3
          </ToolbarButton>
          <Sep />
          <ToolbarButton onClick={() => prefixLines("- ")} title="Bullet list">
            • List
          </ToolbarButton>
          <ToolbarButton onClick={() => prefixLines("1. ")} title="Numbered list">
            1. List
          </ToolbarButton>
          <ToolbarButton onClick={() => prefixLines("> ")} title="Quote">
            ❝ Quote
          </ToolbarButton>
          <Sep />
          <ToolbarButton
            onClick={() => {
              const url = prompt("Link URL:");
              if (!url) return;
              wrapSelection("[", `](${url})`);
            }}
            title="Insert link"
          >
            🔗 Link
          </ToolbarButton>
          <ToolbarButton
            onClick={() => fileRef.current?.click()}
            title="Upload image"
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "🖼 Image"}
          </ToolbarButton>
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
        </div>

        <div className="flex items-center gap-1">
          <TabButton active={tab === "write"} onClick={() => setTab("write")}>
            Write
          </TabButton>
          <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
            Preview
          </TabButton>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={(e) => {
            const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
            if (!item) return;
            const file = item.getAsFile();
            if (!file) return;
            e.preventDefault();
            handleFile(file);
          }}
          onDrop={(e) => {
            const file = e.dataTransfer.files?.[0];
            if (file?.type.startsWith("image/")) {
              e.preventDefault();
              handleFile(file);
            }
          }}
          onKeyDown={(e) => {
            const meta = e.ctrlKey || e.metaKey;
            if (meta && e.key.toLowerCase() === "b") {
              e.preventDefault();
              wrapSelection("**");
            } else if (meta && e.key.toLowerCase() === "i") {
              e.preventDefault();
              wrapSelection("*");
            } else if (e.key === "Tab") {
              e.preventDefault();
              insertAtCursor("  ");
            }
          }}
          spellCheck
          rows={22}
          placeholder="Write your post in markdown — drop an image to upload, or use the toolbar."
          className="w-full resize-y px-5 py-4 font-mono text-sm leading-relaxed outline-none min-h-[420px]"
        />
      ) : (
        <div
          className="prose-pregna max-w-none px-5 py-6 min-h-[420px]"
          dangerouslySetInnerHTML={{ __html: previewHtml || "<p class='text-[var(--brand-muted)]'>Nothing to preview yet.</p>" }}
        />
      )}

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="rounded-md px-2.5 py-1.5 text-sm text-[var(--brand-ink)] hover:bg-white hover:text-[var(--brand-purple)] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-[var(--brand-purple)]/15" />;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
        active ? "bg-white text-[var(--brand-purple)]" : "text-[var(--brand-muted)] hover:text-[var(--brand-purple)]"
      }`}
    >
      {children}
    </button>
  );
}
