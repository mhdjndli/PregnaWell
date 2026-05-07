# PregnaWell — Website

Next.js 16 site for [PregnaWell](https://pregnawell.com), built for Maha Hommos.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript
- Tailwind CSS v4 (`@theme inline` in `src/app/globals.css`)
- `next/font` — Inter (body) + Fraunces (display)
- File-based Markdown blog (`gray-matter` + `marked`)

## What this site does

The 4 jobs of the website:

1. **Drive leads to the VSL funnel** — primary CTA: "Watch a Free Masterclass" → `pregnawell.clinic/vsl-fertility-evaluation-call-pregnawell`
2. **Drive traffic to the Fertility Score Tool** — secondary CTA (link TBD)
3. **Promote the PregnaScan App** — nav tab + `/pregnascan-app` redirect → `pregnascan.app`
4. **Publish SEO-first blog content** — file-based, editable without a developer (see `content/blog/README.md`)

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

## Project structure

```
src/
  app/
    layout.tsx          # root layout, fonts, header/footer/whatsapp
    page.tsx            # home
    story/page.tsx      # founder story
    blog/page.tsx       # blog index
    blog/[slug]/page.tsx# individual post
    sitemap.ts, robots.ts
    globals.css         # brand tokens
  components/
    Header.tsx, Footer.tsx, WhatsAppButton.tsx, PressMarquee.tsx
  lib/
    site.ts             # all CTAs, social, press list — single source of truth
    blog.ts             # markdown reader

content/
  blog/                  # one .md file per post (see README inside)

public/
  assets/                # logos + founder photos
```

## Editing blog posts

The team can add or edit posts directly in `content/blog/` — see [content/blog/README.md](content/blog/README.md) for the front-matter spec and workflow.

## Editing CTAs / links

All external URLs and social handles live in [`src/lib/site.ts`](src/lib/site.ts). Update there once and every page picks it up.

## Deploy

This repo is ready for Vercel, Netlify, or any Node host. The `next.config.ts` already includes the redirect for `/pregnascan-app → pregnascan.app`.
