## Mayaworld Phase 2 — Isometric View, Default Zoom & UI Refinement

The screenshot shows the world rendered at 1:1 device pixels on a mobile screen — sages are ~12px tall, tiles are 16px, and the HUD chip eats the corner. Phase 2 fixes both **clarity** (zoom/scale) and **perspective** (true isometric), plus polishes the HUD for the small viewport.

### Goals
1. **Default zoom**: world feels close and readable on phones without pinch-zoom
2. **Isometric projection**: clean 2:1 iso tiles + characters with clear depth
3. **HUD refinement**: bigger touch targets, less corner clutter, dialogue/narration easier to read on mobile
4. No copied assets from `isomiddleearth` — we generate our own iso tile atlas in code (zero AI tokens, zero network)

---

### Step 1 — Default zoom & clarity (ships immediately, even before iso)

- Introduce a `RENDER_SCALE` factor (default `2` on mobile ≤640px, `1.75` on tablet, `1.5` on desktop) applied as a single canvas scale transform around the whole render. Tiles + sprites stay crisp because we keep `image-rendering: pixelated` on the canvas element.
- Add pinch-to-zoom and wheel-zoom (clamped 1×–3×) with smooth interpolation; double-tap to reset.
- Camera continues to follow the bound sage; we just draw fewer, larger tiles per screen.
- Increase sage label font from 7→10px and dialogue bubble from 8→11px at base scale.

### Step 2 — Isometric tile renderer

New module `src/mayaworld/iso/`:

```text
iso/
  projection.ts    gridToScreen(x,y,z), screenToGrid(), painter sort
  tileAtlas.ts     procedural atlas: 64×40 diamond top + side walls per tile type
  characterAtlas.ts pre-bake 4-dir × 2-frame sprite per sage (32×56)
  renderIso.ts     replaces the orthographic loop in renderer.ts
```

Tile atlas (no external assets):
- Base diamond top: 64w × 32h
- Side wall: +8h for elevated tiles (forest canopy, hut roof, mountain, temple, shrine, ruins)
- Tile types reuse our existing palette in `constants.ts`; we just re-shape them as iso diamonds with a top face + two side faces (left dark, right slightly darker)
- Animated variants (water, tall_grass, flower) get 2 atlas frames blitted by `animFrame % 60`

Character atlas:
- Each sage rendered once into 4 directions × 2 frames using the redesigned silhouette from Phase 1, then blitted as a sprite — much faster than per-frame procedural draw
- Z-height bump for prop (flame, crystal, lotus) so it sits correctly above the iso tile

Render loop:
- Painter's order: sort tiles by (y + x) ascending, then z; sages inserted into the same sorted list so they correctly occlude/get-occluded by huts, trees, mountains.
- Camera converts bound-sage `(gx, gy)` → screen via `gridToScreen` and centers it.
- Same `world.tiles[][]` data — only renderer changes. `agentEngine`, `sessionController`, `dialogueBank`, weather, day/night overlay all keep working.

### Step 3 — Iso-aware tap input

`screenToGrid()` translates tap coordinates back to grid cells so authority-mode movement on touch still works. Movement still snaps to 4 cardinal directions.

### Step 4 — UI refinement (mobile-first)

Driven by the screenshot:
- **Top-left HUD chip**: collapse into a single compact pill that shows only sage swatch + name; tap to expand stats. Removes the four stacked rows.
- **Top-right**: replace text buttons with two icon buttons (eye / door). Larger 40×40 touch targets. `aria-label` for accessibility.
- **Minimap**: hide by default on mobile, toggle via small icon in the bottom-right; on tablet/desktop keep visible but smaller.
- **Narration line**: increase to 16px serif, max-width capped, sit above a safe-area inset so OS nav bar doesn't cover it.
- **Dialogue overlay** (in-canvas bubble + bottom RPG panel): both already redesigned in Phase 1; here we just bump font and add `safe-area-inset-bottom` padding.
- **Pause overlay**: center seal mark, larger serif copy (already mostly clean).

### Step 5 — Realm-aware ambient tint (light Phase 3 preview)

While in iso mode, the strongest realm under the bound sage (forest / shore / sanctum / hamlet / highlands / wilds) softly tints the global overlay (very subtle, ≤8% alpha). Free preview of Phase 3's mood system — costs nothing.

---

### Out of scope (deferred to Phase 3)
- Realm-specific particle systems (petals, fireflies, gulls)
- Decorative prop layer (lanterns, prayer flags, water-lilies)
- Sage daily intentions
- Audio toggle

### Files we expect to change / add
- **New**: `src/mayaworld/iso/projection.ts`, `tileAtlas.ts`, `characterAtlas.ts`, `renderIso.ts`
- **Modified**: `src/mayaworld/renderer.ts` (delegate to iso renderer when enabled), `src/pages/Mayaworld.tsx` (HUD refinement, zoom controls, pinch handlers, iso tap mapping), `src/mayaworld/constants.ts` (add `RENDER_SCALE`, iso tile dims)

### Risk & mitigation
- Iso painter sort over an 80×80 grid = 6400 tiles per frame. Mitigation: only sort/draw the tiles inside the camera viewport (~150–250 tiles), and use cached atlas blits.
- Mobile perf: we cap RENDER_SCALE × DPR at 3 effective pixels and use `image-rendering: pixelated` to avoid blurry upscale.
- Atlas generation runs once at session start (~50ms one-time cost).

### Suggested rollout
Ship Step 1 (zoom/clarity) first inside the same commit as Steps 2–3 (iso) so the user sees the big visual jump together. Step 4 (HUD polish) and Step 5 (realm tint) round it out.
