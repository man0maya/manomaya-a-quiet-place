## Mayaworld Visual & Life Upgrade — 3-Phase Plan

`isomiddleearth` is a tile-paint tool built around pre-rendered isometric PNG sprites (128×64 tile footprint, 130×230 character sprites) grouped into "realms" (Shire, Gondor, Rohan, Lothlórien, Rivendell, Moria, Mordor) with grouped tile categories (Terrain, Water & Bridges, Trees, Dwellings, Buildings, Decorations).

We will not copy its assets (license/branding belongs to that project and its theme is Tolkien). Instead we adopt its **structural ideas**: an isometric projection, realm-style cohesive palettes, layered sprite categories, and a clean toolbar-driven UI. Mayaworld remains a *living simulation* (not a paint tool), so we keep our sage agents, dialogue, and seasons.

### Goals
- Cleaner, more readable world (isometric, less visual noise)
- Cleaner character design (consistent silhouettes, distinct sages)
- More "life" (richer ambient behaviors, props, sound of presence)
- Keep zero-AI-token runtime

---

### Phase 1 — Cleaner UI shell & character redesign (top-down, low risk)

Stay top-down for one phase to ship a visible win fast while phase 2 prepares the iso renderer.

- Redesign sage sprites in `renderer.ts`:
  - 16×24 character footprint, 4-direction walk, 2-frame idle bob
  - Strong silhouette: hood + robe + staff/bowl/scroll prop per sage
  - Palette restricted to project tokens (teal/gold/off-white) plus one signature accent per sage
  - Soft contact shadow ellipse
- HUD/UI cleanup in `Mayaworld.tsx`:
  - Single bottom dock (sage list, time-of-day, weather, world #) replacing scattered chips
  - Dialogue bubble: rounded card, serif, drop-shadow, tail pointing to sage; max 2 lines, fade in/out
  - Memory ribbon collapsed into a small "scroll" toggle
  - Pause/rest overlay refined with a centered seal mark
- Color & contrast pass via `index.css` tokens only (no hardcoded colors)

Deliverable: same simulation, dramatically cleaner read.

---

### Phase 2 — Isometric world renderer (the iso-middle-earth inspiration)

Convert the world view from orthographic top-down to true 2:1 isometric, pre-baked sprite tiles drawn in our own art style.

- New `src/mayaworld/iso/` module:
  - `projection.ts`: `gridToScreen(x,y,z)`, `screenToGrid()`, painter's-order sort
  - `tileAtlas.ts`: procedural canvas atlas generated once at boot — for each tile type (grass, sand, water, stone, forest, hut, temple, bridge, flower, mountain, shrine, ruins, garden, village) we pre-render a 64×32 diamond top + side walls into an offscreen canvas. No external assets.
  - `characterAtlas.ts`: pre-render each sage's 4-dir × 2-frame sprites (32×48) once
  - `renderIso.ts`: replaces the per-tile draw loop with atlas blits in painter order; supports z-height for huts/trees/mountains
- Camera: smooth follow on focused sage, edge-pan on hover, pinch/wheel zoom (1×–2×)
- Hover preview: subtle outline diamond on tile under cursor (mirrors iso-middle-earth feel)
- Keep `worldGenerator.ts` outputs unchanged (tile grid is the same data) — only rendering changes

Deliverable: top-down → clean isometric view with the same seeded worlds.

---

### Phase 3 — More life: realms, props, and ambient behaviors

- "Realms" inspired by iso-middle-earth realm grouping, mapped to our spiritual themes:
  - Grove (forest+flower), Sanctum (temple+shrine+stone_path), Hamlet (hut+village+garden), Highlands (mountain+stone), Shore (beach+water+bridge), Wilds (tall_grass+ruins+cave)
  - Each realm has its own palette overlay + ambient particles (petals in Grove, incense in Sanctum, hearth smoke in Hamlet, mist in Highlands, gulls in Shore, fireflies in Wilds)
- Decorative prop layer (no gameplay impact): lanterns along stone_path at night, prayer flags on bridges, water-lilies on lakes, drying laundry near huts, stacked stones near shrines. Procedurally seeded per world.
- Sage life upgrades:
  - Daily "intentions" picked at dawn (visit shrine, gather flower, sit by water) drive their pathing
  - Two sages can meet at landmarks for short conversations (already partially in dialogue bank)
  - Subtle footstep dust + ripples in water when crossing bridges
- Optional ambient audio toggle (off by default, respects "no autoplay motion" memory only when user opts in)

Deliverable: each launch *feels* like a different realm with its own mood, while sages visibly pursue tiny intentions.

---

### Technical notes

- Atlases are generated in-memory at session start (no network, no AI tokens, no shipped binaries).
- Iso conversion is rendering-only; `world.tiles[][]` schema and `Sage` interface stay intact, so `agentEngine.ts`, `sessionController.ts`, `dialogueBank.ts`, and the visibility-pause logic continue to work.
- All colors via `hsl(var(--…))` tokens defined in `index.css`; new realm overlays added as token variants.
- No assets copied from `isomiddleearth`; only the *idea* of isometric tile + character composition and realm-grouped palettes.

### Out of scope
- Multiplayer / shared worlds
- A tile editor UI for users
- 3D / WebGL — staying on 2D canvas for performance and aesthetic consistency

### Suggested order of approval
Approve Phase 1 first (fast visible win). Phase 2 is the largest change. Phase 3 layers on once iso is stable.
