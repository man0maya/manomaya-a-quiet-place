# Mayaworld — Phase 3 Polish + Character Art Upgrade

Four runtime upgrades plus a concrete plan to retire the "cubicle" sage sprites in favor of richer art.

---

## 1. Ambient parallax + time-of-day mood

In `iso/renderIso.ts`, add a layered backdrop drawn before the world:

- **Far layer**: gradient sky that shifts by `world.dayPhase` — dawn peach, midday teal, dusk amber, night indigo (interpolated, not stepped).
- **Mid layer**: 3 soft cloud bands drifting at 0.02/0.05/0.09 px/frame, offset by `camera.x * 0.05` and `camera.y * 0.03` for parallax against the world.
- **Near layer**: faint particles tied to `world.weather` (rain streaks, mist puffs, wind motes) — already partly modeled, just bind drift to camera delta.
- **Ambient tint pass**: existing night overlay becomes a 4-stop tint (dawn warm, day neutral, dusk rose, night cool) at ≤30% alpha so the world stays legible.

All pure rendering — no new state, no AI calls.

## 2. Persist zoom + HUD/minimap prefs

New tiny module `src/mayaworld/prefs.ts` wrapping `localStorage` under key `mayaworld:prefs:v1`:

```ts
{ zoom: number; hudExpanded: boolean; showMinimap: boolean }
```

In `Mayaworld.tsx`:

- On mount: hydrate `zoomRef`, `hudExpanded`, `showMinimap` from prefs (fallback to viewport-based default for zoom).
- On change (zoom buttons, pinch end, HUD toggle, minimap toggle): debounced write (200ms).
- Guard against SSR / blocked storage with try/catch.

## 3. One-tap PNG export

Add an icon button in the top-right HUD cluster ("Save view"). Handler:

1. Pause the RAF for one frame.
2. Re-render to an offscreen `OffscreenCanvas` at 2× current zoom for crispness.
3. `toBlob('image/png')` → trigger download as `manomaya-{sage}-{phase}-{timestamp}.png`.
4. Add a subtle "Saved" toast via existing narration line.

No watermark by default (matches the no-Lovable-badge memory). Pure client-side.

## 4. Smooth camera that tracks the bound sage

Today the camera snaps to `bound.x, bound.y` each frame. Replace with eased follow:

- Add `cameraRef = { x, y }` in `Mayaworld.tsx`.
- Each frame: `camera.x += (targetX - camera.x) * 0.12` (same for y), with snap when distance < 0.02.
- On tap-to-move (authority mode), the sage's `targetX/targetY` already drives motion; the camera will glide naturally. Add a stronger ease (0.18) for the first 400ms after a tap so the pan feels intentional.
- Clamp camera so we never reveal beyond the world edge.

---

## 5. Fixing the "cubicle" characters

The current sages are drawn procedurally as ~24px stacked rectangles in `drawIsoSage`. That's why they read as cubes. Two paths — **pick one or combine**:

### Path A — Stay procedural, add silhouette + shading (fast, no assets)

Refactor `drawIsoSage` to draw on a 32×48 logical sprite:

- Tapered robe outline via `bezierCurveTo` instead of stacked rects.
- 2px outer dark outline (`#1a1208`) for readable silhouette at small sizes.
- Hood drape with a 2-tone shadow under the chin.
- 4-direction body turn driven by `targetX-x, targetY-y` (NE/NW/SE/SW).
- Subtle robe sway sin-wave on idle.

Cost: 1 file, ~1 hour. Keeps everything dynamic and tinted by sage palette.

### Path B — Use real pixel-art sprite sheets (recommended for "alive" feel)

**Where to source (free, permissive):**


| Source                                                                                          | License            | What to grab                           |
| ----------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------- |
| [itch.io — "Mana Seed Character Base" by Seliel the Shaper](https://seliel-the-shaper.itch.io/) | CC0 / paid         | 8-direction walk/idle base, 32×32      |
| [OpenGameArt — "LPC" sage/monk packs](https://opengameart.org/content/lpc-base-assets)          | CC-BY-SA 3.0 / GPL | Robed character bases, 64×64           |
| [itch.io — "Tiny Hero Sprites" by Free Game Assets](https://free-game-assets.itch.io/)          | Free w/ credit     | Compact 16×16 pixel humans             |
| [Kenney.nl — Toon Characters / Isometric](https://kenney.nl/assets)                             | CC0                | Isometric character bases ready-to-use |


For an isometric look that matches the Hasan Harman ISO Middle Earth feel, **Kenney's Isometric Characters** + **Seliel's Mana Seed** recolored is the cleanest combo.

**File layout to add:**

```
public/
  mayaworld/
    sprites/
      sages/
        agni.png        ← 4 dirs × 4 frames, 32×48 each (128×192 sheet)
        ila.png
        ... (one per sage, 9 total)
        _base.png       ← shared base if you recolor at runtime
      props/
        flame.png  fan.png  lotus.png  staff.png  ...
src/
  mayaworld/
    iso/
      spriteAtlas.ts    ← loads sheets once, exposes drawSprite(name, dir, frame)
      renderIso.ts      ← drawIsoSage swaps to spriteAtlas.drawSage(...)
```

`spriteAtlas.ts` responsibilities:

- Preload all 9 sheets during the cloud-transition phase (already a 4s window — perfect).
- Expose `drawSage(ctx, name, dir, frame, x, y)` that blits the right 32×48 cell with `imageSmoothingEnabled = false`.
- Optional runtime tint: draw to offscreen canvas → `globalCompositeOperation = 'source-atop'` with sage's accent color at low alpha.

**How the user supplies assets:**

1. Download a sprite pack from one of the links above.
2. Drop the PNG sheets into `public/mayaworld/sprites/sages/` named `<sage-lowercase>.png`.
3. Tell me the cell size and frame layout (e.g. "32×48, row=direction, col=frame") — I'll wire `spriteAtlas.ts` to match.

If preferred, I can also generate stylized 4-direction sprites with the image tool (one per sage, ~9 calls) — but external pixel art will look more cohesive and "hand-crafted."

### Recommendation

Ship **Path A** in the same commit as items 1–4 above so the world feels immediately alive. Then do **Path B** as a follow-up once you've picked an asset pack — that's the jump from "cubicles" to "characters."

---

## Files touched

**Edit**

- `src/mayaworld/iso/renderIso.ts` — parallax sky, ambient tint, refined `drawIsoSage` (Path A)
- `src/pages/Mayaworld.tsx` — pref hydration, eased camera, export button + handler

**New**

- `src/mayaworld/prefs.ts` — localStorage wrapper
- `src/mayaworld/iso/spriteAtlas.ts` *(only if Path B is approved)*
- `public/mayaworld/sprites/...` *(your asset drop)*

## Out of scope

- Audio ambience (mentioned earlier as Phase 3 deferred)
- Realm-specific particle systems beyond what weather already does

---

**Decision needed:** Path A only, or A now + B after you pick an asset pack? And if B — do you want to source the pack yourself or have me generate sprites? Path B and generate the sprites please 