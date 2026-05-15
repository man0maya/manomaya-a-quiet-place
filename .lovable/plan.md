# Mayaworld — Pan, Reduce Motion, Security Patches

## 1. Drag-to-pan camera (touch + mouse)

Goal: explore the iso world by dragging without triggering tap-to-move; pinch-zoom and tap-to-move keep working.

- In `src/pages/Mayaworld.tsx`:
  - Introduce `panOffsetRef = { x: 0, y: 0 }` (in tile units) added on top of the smooth follow camera. So final cam = followCam + panOffset, clamped to world bounds.
  - Add `isDraggingRef`, `dragStartRef` (clientX/Y + panOffset snapshot), and `dragMovedRef` (bool).
  - On `pointerdown`: record start; on `pointermove` past a 6 px threshold: set `isDraggingRef=true`, convert pixel delta → tile delta using inverse iso (`dx_tiles = (-dxPx/zoom)/(ISO_TILE_W/2)` projected through `screenToGrid` deltas) and update `panOffsetRef`.
  - On `pointerup`: if not dragged → existing tap-to-move; if dragged → swallow tap.
  - Multi-touch (2 fingers) still routes to existing pinch-zoom handler; ignore drag while pinching.
  - "Recenter" icon button in HUD top-right that resets `panOffsetRef` to 0 (camera snaps back to bound sage with smooth ease).
  - Show `cursor-grab` / `cursor-grabbing` on the canvas.

- Edge bounds: clamp the *resulting* camera (follow + pan) to `[2, world.width-2]` × `[2, world.height-2]` (already clamped in `draw`); also clamp `panOffsetRef` so user can't pan past an additional ~6 tiles beyond the bound sage to avoid runaway.

## 2. Reduce Motion option

Goal: a HUD toggle that calms the world for motion-sensitive users.

- Extend `MayaPrefs` in `src/mayaworld/prefs.ts` with `reduceMotion?: boolean`. Default = `prefers-reduced-motion` media query.
- In `Mayaworld.tsx`: `reduceMotion` state, persisted via `savePrefs`, surfaced as a toggle inside the expanded HUD pill (top-left) with a small "Reduce motion" label + Switch.
- Pass `reduceMotion` into `renderWorldIso(..., { reduceMotion })` (extend signature with an options object).
- In `src/mayaworld/iso/renderIso.ts`:
  - `drawAmbientSky`: scale cloud drift speed by `reduceMotion ? 0.15 : 1`; freeze star twinkle phase; skip parallax offset from camera delta.
  - `drawIsoSage`: when `reduceMotion`, set `idleBob = 0` and clamp `stepBob` to 0 (walking still translates position, just no vertical bob); skip meditation ripple expansion (keep static halo).
  - Decor: skip `tall_grass` sway and `lake/water` shimmer phase variation.
  - Keep bound-sage marker pulse but lower amplitude (0.85 ± 0.05 instead of full sin).

## 3. Security patches

- Run `code--dependency_scan`; for each high/critical advisory, `bun update <pkg>` to the suggested minor/patch.
- Run `supabase--linter` and `security--run_security_scan`; address any new warnings (likely RLS / definer / search_path additions only — no schema changes unless a finding demands it).
- Update `mem://security-memory` with anything ignored and why.

## Files

- Edit: `src/pages/Mayaworld.tsx` (pan handlers, recenter button, reduce-motion toggle in HUD, prop wiring).
- Edit: `src/mayaworld/iso/renderIso.ts` (accept options, gate animations).
- Edit: `src/mayaworld/prefs.ts` (add `reduceMotion`).
- Possibly edit: `package.json` / lockfile via `bun update` for security patches.

## Out of scope

No gameplay logic, no schema, no new sprites or visuals beyond the recenter icon.
