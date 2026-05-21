# Blog content

Each `.md` file in this folder becomes a blog post. The team can add, edit, and
remove posts here without any developer involvement.

## File naming

- File name = URL slug. `understanding-the-hpo-axis.md` → `/blog/understanding-the-hpo-axis`
- Use lowercase, hyphens, no spaces.

## Front-matter (the block at the top)

```yaml
---
title: "Article title shown on the page"
description: "1–2 sentence meta description (used for SEO + previews)"
date: "YYYY-MM-DD"           # publish date, controls sort order
author: "Maha Hommos"
category: "Fertility"          # one short category label
tags: ["fertility", "hormones"] # optional
cover: "/assets/maha-1.jpg"     # featured image (path inside /public)
draft: false                    # set to true to hide a post from the site
---
```

After the closing `---`, write the article body in Markdown:

- `## Heading` → section heading
- `**bold**` and `*italic*`
- `- item` → bullet list
- `> quote` → blockquote
- `[link text](https://...)` → link
- `![alt text](/assets/your-image.jpg)` → inline image (drop the file in `public/assets/` first)

## SEO edits to live posts

Editing the `title`, `description`, `slug` (file name), or body of an already
published post is safe, Next.js will regenerate the page automatically. If you
rename a file you should add a redirect for the old slug in `next.config.ts` so
no inbound link breaks.

## Adding images

Put image files in `public/assets/` and reference them with a path that starts
with `/assets/`.

## Removing a post

Delete the `.md` file or set `draft: true` in the front-matter. The post will
disappear from the index and the sitemap on the next build.
