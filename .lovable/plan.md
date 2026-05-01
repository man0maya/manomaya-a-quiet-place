## Mayaworld v2 — 3-Phase Enhancement Plan

Goal: a living, ever-changing world with crisp, readable dialogue, that only awakens when a viewer is present. **Zero AI tokens** — everything procedural in code.

---

### Phase 1 — Readable Dialogue + Viewer-Gated World

**1A. Dialogue legibility (the hardest blocker right now)**
Today every dialogue/narration uses `text-[hsl(var(--foreground))]/30–35` over a half-transparent black panel — that's why it looks blurry/washed.

Changes in `src/pages/Mayaworld.tsx`:
- Narration panel (observe mode), interaction dialog (sage panel), action menu, feedback toasts, mode prompt:
  - Solid backdrop: `bg-black/85` with `backdrop-blur-md`
  - Border: `border-[hsl(var(--primary))]/30` (was `/8–/12`)
  - Body text: `text-[hsl(var(--foreground))]/90` (was `/30`), `font-serif`, `text-[15px]`, `leading-relaxed`, `tracking-normal` (remove the wide letter-spacing)
  - Sage name: `text-[hsl(var(--primary))]` full opacity, `text-sm`
  - Drop the italic on long narration (italic + low opacity = unreadable on small screens)
  - Add `text-shadow: 0 1px 2px rgba(0,0,0,0.8)` via inline style for any text overlaid on canvas
- Mobile: ensure panels use `text-base` (16px) min, with `px-5 py-4` padding
- Action buttons: `text-[hsl(var(--foreground))]/85` resting, `text-[hsl(var(--primary))]` hover, border `/30`

**1B. Viewer-presence gate (world dormant when nobody's watching)**
Right now `startSession` runs the world tick the moment the user enters a code. Change to: the simulation only ticks while the tab is focused and visible.

In `src/mayaworld/sessionController.ts`:
- Add `isPaused` flag on Session
- Tick loop checks `if (session.isPaused) return;` before advancing time/sage AI
- Expose `pauseSession(session)` / `resumeSession(session)`

In `src/pages/Mayaworld.tsx`:
- `document.visibilitychange` listener → pause when hidden, resume when visible
- `window.blur` / `focus` listeners as backup
- Show a soft "✦ The world rests until you return" overlay when paused
- Render loop continues (so canvas stays painted) but world state is frozen

This satisfies "world will only start when someone logs in to watch."

---

### Phase 2 — Ever-Changing World (procedural variety, no AI)

**2A. Per-session biome layout**
`worldGenerator.ts` currently uses a fixed top-to-bottom band layout (Mountain → Vashistha → Daksha → Village → Garden → Groves → Beach). Every world looks the same shape.

Replace with a **biome zone shuffler**:
- Define 8 biome archetypes: `mountain_realm`, `silent_forest`, `flower_plains`, `sage_village`, `lake_basin`, `garden_terraces`, `groves_of_light`, `beach_ruins`
- Each session picks a random rotation (0/90/180/270°) + horizontal mirror
- Voronoi-style region assignment using 6–9 random seed points, each claiming nearest tiles → biomes can appear in *any* corner
- Major features (temple, cave, ruins, lake) are placed inside whichever biome region matches them, not at hard-coded coordinates

**2B. Dynamic structure variety**
- Randomize structure counts each session: 1 temple (always), 2–5 shrines, 1–2 caves, 1–3 ruin clusters, 0–2 extra hut clusters
- Random rotations for structure shapes (so the temple isn't always the same 5×4)
- Add 3 new tile types: `bamboo`, `pond`, `bonfire` (with renderer entries) for additional variety

**2C. Visible world evolution during a session**
World currently feels stagnant because nothing changes mid-session. Add:
- **Drifting weather** — weather changes more often (every 2–4 min vs current 2–6+), with smooth transitions (`mist → light_rain → rain → clear`)
- **Day/night** is already there but make it visually obvious — apply a global tint pass in `renderer.ts` (warm dawn, neutral day, golden evening, deep blue night with star dots)
- **Ephemeral events** every 60–120s, randomly: a flower bloom radius spreads briefly, fireflies appear in a grove, a rainbow over the lake after rain, a meteor at night, leaves drift across the screen on wind
- **Tile decay/regrowth** — `flower` tiles can wilt to `grass` and regrow; `tall_grass` cycles; gives micro-changes every ~30s

**2D. Re-seed on entry**
Each entry-code session generates a brand new seed (already does via `Math.random()`), but ensure the seed is logged on screen as a tiny "world #XXXX" tag so users can *see* it's different each time.

---

### Phase 3 — Polish & Re-engagement

**3A. Sage behavior diversity**
- Add 6 new sage activities to `dialogueBank.ts` and `agentEngine.ts`: `gardening`, `chanting`, `gathering`, `teaching` (pairs with another sage), `wandering_far`, `stargazing` (night only)
- Sage states pick activity based on personality + tile + time of day so each session feels different
- Two-sage interactions: occasionally two sages meet and exchange a dialogue line (visible bubble between them)

**3B. Dialogue bank expansion (still no AI)**
- Grow `dialogues[]` from 30 → 120 lines, organized by `temperament` so each sage has its own voice
- Add weather + time + biome combo lines (e.g. `night_grove`, `rain_temple`)
- Avoid repetition: track last 10 lines per sage, never repeat

**3C. World memory ribbon**
A tiny scrolling ticker at the bottom-left logs ambient events:
> "Pulastya reached the garden · Mist gathers over the lake · Marichi began to chant"
Updates every ~10s, max 3 lines visible, `text-[hsl(var(--foreground))]/70` for full readability.

**3D. Re-entry hint**
On `leave`, show: *"World #1847 dissolves. The next will be different."* — reinforces the ever-changing promise.

---

### Files Touched

```text
src/mayaworld/constants.ts       — new tiles, new biome archetypes, expanded items
src/mayaworld/worldGenerator.ts  — voronoi biome layout, rotation/mirror, dynamic structures
src/mayaworld/renderer.ts        — new tile drawings, day/night tint pass, ephemeral effects layer
src/mayaworld/agentEngine.ts     — new activities, two-sage interactions
src/mayaworld/sessionController.ts — pause/resume, visibility gating
src/mayaworld/dialogueBank.ts    — 4× more lines, no-repeat tracking, biome+weather combos
src/pages/Mayaworld.tsx          — visibility listener, dormant overlay, readable text styles, world # tag, memory ribbon
```

### Non-goals / constraints respected
- No AI / Lovable AI calls anywhere — purely seeded procedural code
- No new dependencies, no new DB tables (Mayaworld remains ephemeral per project memory)
- Existing access-code entry, karma, moments, inventory all preserved
