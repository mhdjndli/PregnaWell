import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  author?: string;
  category?: string;
  tags?: string[];
  cover?: string;
  draft?: boolean;
};

export type BlogPost = BlogFrontmatter & {
  slug: string;
  readingMinutes: number;
  html: string;
};

export type BlogSummary = BlogFrontmatter & {
  slug: string;
  readingMinutes: number;
};

function readFiles() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
}

function slugFromFile(file: string) {
  return file.replace(/\.(md|mdx)$/i, "");
}

function readingTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export function getAllPosts(): BlogSummary[] {
  const files = readFiles();
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const fm = data as BlogFrontmatter;
    return {
      ...fm,
      slug: slugFromFile(file),
      readingMinutes: readingTime(content),
    };
  });
  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): BlogPost | null {
  const files = readFiles();
  const file = files.find((f) => slugFromFile(f) === slug);
  if (!file) return null;
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const fm = data as BlogFrontmatter;
  if (fm.draft) return null;
  const html = marked.parse(content, { async: false }) as string;
  return {
    ...fm,
    slug,
    readingMinutes: readingTime(content),
    html,
  };
}

export function getAllSlugs(): string[] {
  return readFiles().map(slugFromFile);
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
