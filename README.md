# PregnaWell — Website

Next.js 16 site for [PregnaWell](https://pregnawell.com), built for Maha Hommos.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript
- Tailwind CSS v4 (`@theme inline` in `src/app/globals.css`)
- `next/font` — Inter (body) + Fraunces (display)
- Postgres for blog content (admin panel) — `pg` driver, no ORM
- `marked` for markdown rendering

## What this site does

The 4 jobs of the website:

1. **Drive leads to the VSL funnel** — primary CTA: "Watch a Free Masterclass" → `pregnawell.clinic/vsl-fertility-evaluation-call-pregnawell`
2. **Drive traffic to the Fertility Score Tool** — secondary CTA (link TBD)
3. **Promote the PregnaScan App** — nav tab + `/pregnascan-app` redirect → `pregnascan.app`
4. **Publish SEO-first blog content** — managed by the team via `/admin`

## Admin panel

`/admin` — sign in with the password set in `ADMIN_PASSWORD`. From there:

- See every post (drafts, scheduled, published) with status pills
- Create new posts with a markdown editor (toolbar, image paste/drop, live preview)
- Upload cover image, set category, tags, author, custom meta title/description
- **Schedule** posts — pick a future date and the post auto-publishes when it passes
- Edit or delete any existing post

Existing markdown posts in `content/blog/*.md` are auto-imported into the database on first boot.

## Required environment variables

| Variable | Where it comes from | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | You set it on Railway | The single password for `/admin`. Sessions invalidate when this changes. |
| `DATABASE_URL` | Railway sets it automatically when you add a Postgres plugin | Postgres connection string. Used for posts + image storage. |
| `PGSSLMODE` | Optional — set to `disable` for local Postgres without SSL | Defaults to require-SSL in production. |

## Deploy on Railway

1. Connect the GitHub repo to a Railway service.
2. Click **+ New** → **Database** → **Add PostgreSQL**. Railway auto-injects `DATABASE_URL` into your service.
3. Add a service variable: `ADMIN_PASSWORD=<choose a strong password>`.
4. Deploy. On first boot, the schema is created automatically and existing markdown posts seed the database.

The first time you visit `/admin`, sign in with the password you set. Done.

## Local development

```bash
npm install
cp .env.example .env.local
# fill in ADMIN_PASSWORD and DATABASE_URL
npm run dev      # http://localhost:3000
npm run build
npm run start
```

If you don't have a local Postgres, you can either:
- Run one in Docker: `docker run -d --name pw-pg -p 5432:5432 -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=pregnawell postgres:16` and set `DATABASE_URL=postgresql://postgres:pw@localhost:5432/pregnawell` and `PGSSLMODE=disable`
- Or point `DATABASE_URL` at the Railway Postgres connection string (copy from the Railway dashboard).

The public blog falls back to an empty list if `DATABASE_URL` is unset, so the rest of the site still works during local dev without Postgres.

## Project structure

```
src/
  app/
    layout.tsx              # root layout (html/body, fonts only)
    (public)/
      layout.tsx            # header/footer/WhatsApp wrapper
      page.tsx              # home
      story/page.tsx
      blog/page.tsx         # blog index (filters by publish_at)
      blog/[slug]/page.tsx  # individual post
    admin/
      layout.tsx            # admin shell (no public chrome)
      page.tsx              # login
      dashboard/page.tsx    # posts list
      posts/new/page.tsx
      posts/[id]/edit/page.tsx
      actions.ts            # server actions (auth + CRUD + upload)
    api/images/[id]/route.ts# serves uploaded images from Postgres
    sitemap.ts, robots.ts
    globals.css
  components/
    Header.tsx Footer.tsx WhatsAppButton.tsx PressMarquee.tsx
    Programs.tsx Testimonials.tsx Faq.tsx
    admin/LoginForm.tsx admin/AdminShell.tsx
    admin/MarkdownEditor.tsx admin/PostEditor.tsx
  lib/
    site.ts                 # all CTAs, social, press list
    db.ts                   # pg pool + schema migration + seed
    auth.ts                 # cookie sign/verify (HMAC of password)
    blog.ts                 # post queries (public + admin)

content/blog/               # legacy markdown — auto-imported on first DB boot
public/assets/              # logos + founder photos
```

## Editing CTAs / links

All external URLs and social handles live in [`src/lib/site.ts`](src/lib/site.ts). Update there once and every page picks it up.

## Security notes

- `/admin` is `noindex` and uses an `httpOnly`, `SameSite=Lax`, `Secure` (in prod) session cookie.
- The session token is HMAC-signed with a key derived from `ADMIN_PASSWORD` itself — rotating the password instantly invalidates all sessions.
- Image uploads validate MIME type and cap at 8MB.
- Slug uniqueness is enforced in the database.
