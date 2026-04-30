
# Blogs Revamp + SEO Optimization

Transform the Reflections tab into a clean, author-only **Blogs** experience matching the uploaded screenshots, and strengthen SEO across the site.

---

## 1. Rename "Reflections" → "Blogs"

**Navigation (`src/components/Navigation.tsx`)**
- Change `{ name: "Reflections", path: "/feed" }` → `{ name: "Blog", path: "/blog" }`
- Keep "Reflections Book" as-is (that's the daily-reflection archive — separate feature).

**Routes (`src/App.tsx`)**
- New primary route: `/blog` → `Blog` page
- New detail route: `/blog/:id` → `BlogDetail` page
- Redirect old paths: `/feed`, `/reflections`, `/stories`, `/stories/:id` → `/blog` (or `/blog/:id` where applicable)

**Footer (`src/components/Footer.tsx`)**
- Replace "Reflections" / "Blog" link → point to `/blog`

---

## 2. Remove AI Generator from Blog Page

The current `Feed.tsx` mixes admin posts + AI reflections + a `ReflectionInput` generator. The new Blog page will:

- **Remove** `ReflectionInput`, `ReflectionCard`, `useReflections` usage, the All/Notes/Reflections filter, and the AI-generation section.
- **Keep only** admin-authored posts from the `posts` table via `usePublicPosts()`.
- **Keep** the search bar (searches title + content).

The `useReflections` hook, `ReflectionInput`, daily reflection, and Reflections Book remain untouched — they stay as separate features on the homepage and `/reflections-book`.

---

## 3. Blog List Page (`src/pages/Blog.tsx` — new)

Matches Screenshot 2 ("Author Blog"):

```text
┌─────────────────────────────────┐
│         ✒ (icon)                │
│        Author Blog              │
│  Personal notes and deeply       │
│   considered thoughts           │
└─────────────────────────────────┘

┌──────────────────────────────────┐
│  [   hero image (16:9)        ]  │
│                                  │
│  NOTE                            │
│  Welcome Traveler                │
│  a note to visitor/traveler      │
│  Feb 8, 2026  ·  Read more →    │
└──────────────────────────────────┘
```

Card layout:
- Rounded card, subtle teal-tinted background, hairline border
- Hero image at top (aspect-video, `loading="lazy"`, `decoding="async"`)
- Bookmark icon top-right (uses existing favorites hook)
- Tiny uppercase label ("NOTE" / "REFLECTION" / category) above title
- Serif title (Cormorant Garamond, large)
- One-line muted excerpt
- Footer row: `published_at` formatted as "MMM d, yyyy" + "Read more" link
- Whole card clickable → navigates to `/blog/:id`
- Framer-motion stagger-in on scroll

No body content shown in list view (current `PostCard` dumps full HTML — that's why it looks crowded). The new card shows excerpt only.

---

## 4. Blog Detail Page (`src/pages/BlogDetail.tsx` — new)

Matches Screenshot 1 ("Welcome Traveler"):

```text
        NOTE
   Welcome Traveler
   manomaya  ·  Feb 8, 2026

  [    hero image (rounded)    ]

  Welcome to Manomaya traveler.
  Yes... traveler. Because that's
  what you are. You are not just a
  visitor to this page. You are a
  visitor to existence itself...

  [more justified paragraphs]
```

Structure:
- Back link "← Back to Blog" (top-left)
- Centered eyebrow label ("NOTE")
- Centered serif H1 title
- Centered byline: `manomaya · {date}` (and read time if present)
- Rounded hero image (full-width within reading column, ~720px max)
- Article body in a narrow reading column (~640px), justified text, generous line-height (1.8), serif body for long-form feel matching the screenshot
- Sanitize `post.content` HTML with DOMPurify (already a dep)
- Footer: Like + Share buttons, "← More posts" link
- Floating bookmark button top-right (matches screenshot)

Data source: `posts` table by `id`. If not found → redirect to `/blog` with toast.

---

## 5. SEO Optimization

### Per-page SEO
- `Blog.tsx`: SEOHead with title "Blog — Notes & Reflections by manomaya", description, `canonicalUrl=/blog`
- `BlogDetail.tsx`: dynamic SEOHead per post
  - `title = {post.title} | Manomaya`
  - `description = post.excerpt || first 160 chars of stripped content`
  - `image = post.image_url || default`
  - `type="article"`
  - `canonicalUrl = /blog/{id}`

### Structured data (JSON-LD)
Extend `SEOHead.tsx` to optionally accept an `article` prop and emit a `<script type="application/ld+json">` with schema.org `BlogPosting`:
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "...",
  "image": "...",
  "datePublished": "...",
  "dateModified": "...",
  "author": { "@type": "Person", "name": "manomaya" },
  "publisher": { "@type": "Organization", "name": "Manomaya" }
}
```

### Sitemap & robots
- Update `public/robots.txt` to reference `https://manomaya.lovable.app/sitemap.xml`
- Add a static `public/sitemap.xml` listing core routes (`/`, `/blog`, `/gallery`, `/about`, `/reflections-book`, `/mayaworld`). Note: dynamic per-post URLs can't be added to a static sitemap; add a TODO comment for a future edge-function-generated sitemap.

### Misc SEO polish
- Ensure every `<img>` has descriptive `alt`
- `index.html`: verify `<meta name="description">`, OG tags, theme-color (only adjust if missing)
- Add `aria-label` on icon-only buttons in the new pages

---

## 6. File Changes Summary

**Create**
- `src/pages/Blog.tsx` — list page
- `src/pages/BlogDetail.tsx` — detail page
- `public/sitemap.xml` — static sitemap

**Edit**
- `src/App.tsx` — routes & redirects
- `src/components/Navigation.tsx` — rename label + path
- `src/components/Footer.tsx` — update link
- `src/components/SEOHead.tsx` — add JSON-LD support, optional article schema
- `public/robots.txt` — add sitemap reference

**Leave untouched**
- `src/components/DailyReflection.tsx`, `useReflections.ts`, `ReflectionInput.tsx`, `ReflectionCard.tsx`, `pages/ReflectionsBook.tsx`, `pages/Feed.tsx` (Feed becomes orphaned — keep as fallback for the redirect, or delete; I'll delete to keep things clean)
- All admin pages, Mayaworld, Gallery, Hooks for posts, Supabase schema (no migrations needed)

---

## 7. What This Does NOT Do

- No database changes (uses existing `posts` table)
- No new dependencies
- No changes to the admin posts editor (admin already creates posts with title/content/image)
- No changes to AI reflection daily generator or Reflections Book
- No removal of homepage AI reflection widget (it lives separately on `/`)
