
# Redesign the /feed Reflections Page

A calm, minimal blog-feed redesign focused on readability, breathing room, and a meditative visual rhythm.

---

## What Changes

### 1. ReflectionCard.tsx -- Full Redesign

Rework the card to follow the requested structure:

- **Top label**: A small, uppercase "Reflection" label in muted text
- **Title area**: The user's input prompt displayed as a bold serif heading (or a default title like "A Moment of Stillness" when no user input exists)
- **Quote as summary**: The quote rendered in slightly lighter italic text as a one-line summary beneath the title
- **Body text (explanation)**: Split into multiple paragraphs using double-newline splitting, each wrapped in its own `<p>` tag with `mb-3` (12px) spacing between them. Line-height set to `leading-[1.7]` for comfortable reading
- **Footer**: Author ("manomaya") and date in small muted text, separated from the body by subtle spacing
- **Card styling**: Replace gradient background with a simple soft background (`bg-card/40`), very light border (`border-primary/5`), `rounded-xl`, no shadow. Max content width of `max-w-[700px]` centered within the card
- **Favorite/Share buttons**: Kept but styled more subtly in the footer row

### 2. PostCard.tsx -- Matching Redesign

Apply the same calm card structure:

- **Top label**: "Note" in small uppercase
- **Title**: Post title in bold serif
- **Excerpt**: As lighter summary text
- **Body content**: Already uses `dangerouslySetInnerHTML`; wrap in a container with `leading-[1.7]` line-height and proper paragraph spacing via prose styles
- **Footer**: Author and date, matching the reflection card style
- **Card styling**: Same as ReflectionCard -- soft, borderless, airy

### 3. Feed.tsx -- Layout Adjustments

- Increase spacing between cards from `space-y-8` (32px) to `space-y-10` (40px) for clear separation
- Constrain the feed content column to `max-w-[750px]` (from current `max-w-3xl` which is 768px -- close but we keep it explicit)
- Add more vertical padding around sections for breathing room
- Soften the search/filter bar styling to match the calm theme

### 4. Mobile Responsiveness

- Cards use `p-5` on mobile, `md:p-8` on desktop
- Text content naturally constrains within the card on small screens
- Same line-height and paragraph spacing apply on all screen sizes
- Filter buttons remain horizontally scrollable on mobile

---

## Technical Details

**Files modified:**
| File | Changes |
|---|---|
| `src/components/ReflectionCard.tsx` | New card structure with label, title, quote summary, paragraphed body, calm footer. Explanation text split by `\n\n` into separate `<p>` tags |
| `src/components/PostCard.tsx` | Matching card structure with "Note" label, softer styling, improved prose line-height |
| `src/pages/Feed.tsx` | Increase card gap to `space-y-10`, constrain width, add breathing room |

**No new dependencies or database changes required.**
