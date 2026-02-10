
# Mayaworld -- Ephemeral Autonomous Simulation

A new route at `/mayaworld` that presents a browser-based, in-memory autonomous world rendered on HTML Canvas. No backend, no persistence -- everything lives and dies in a single browser session.

---

## Architecture Overview

The feature is entirely client-side. A set of modular files handle world generation, agent AI, rendering, and session lifecycle. The entry point is a new page component at `/mayaworld`.

```text
src/
  pages/
    Mayaworld.tsx              -- Page component (entry screen + canvas host)
  mayaworld/
    constants.ts               -- Sage definitions, access codes, colors, tile types
    types.ts                   -- All TypeScript interfaces (World, Sage, Tile, etc.)
    worldGenerator.ts          -- Procedural island generator (terrain, regions)
    agentEngine.ts             -- Autonomous sage behavior (needs, decisions, movement)
    renderer.ts                -- HTML Canvas drawing (map, sprites, day/night)
    sessionController.ts       -- Tick loop, init/destroy, co-conscious prompts
    dialogueBank.ts            -- Pool of calm dialogue lines for sage interactions
```

---

## 1. Entry Screen

A full-screen minimal page with:
- Calm centered text: a short poetic line (no explanation of mechanics)
- A single input field for the 4-digit access code
- On valid code (1111-9999): fade out, generate world, enter simulation
- On invalid code: gentle shake or brief "The path is not yet open" message
- Styled to match Manomaya's teal/gold/serif aesthetic

## 2. World Generation (`worldGenerator.ts`)

Procedurally generates a small island map as a 2D tile grid (roughly 40x30 tiles):

- **Tile types**: water, sand, grass, forest, stone, hut, river, meditation-clearing
- **Algorithm**: Start with water, place an island blob using noise/random fill, then scatter regions (a river cutting through, a cluster of huts, forest patches, open clearings)
- **Mario-inspired**: Top-down view with colorful, distinct tile sprites drawn as simple colored rectangles/shapes on canvas (green grass, dark green trees, blue water, brown huts, sandy paths) -- a charming, blocky open-world feel
- **Generated fresh** every session -- no two worlds are alike

## 3. Characters / Sages (`agentEngine.ts`)

Nine sages, each with:

| Property | Description |
|---|---|
| `name` | One of the 9 names (Bhrigu, Pulastya, etc.) |
| `temperament` | Unique trait (contemplative, nurturing, curious, etc.) |
| `position` | Current x,y on the map |
| `target` | Where they're walking to |
| `needs` | `{ energy, hunger, social, purpose }` -- values 0-100, drift over time |
| `state` | Current activity: walking, resting, meditating, observing, conversing |
| `mood` | Derived from needs (serene, restless, content, weary, etc.) |

**Behavior loop** (each tick):
1. Update needs (slow drift based on current activity)
2. Evaluate: if a need is high enough, pick an activity to address it (hungry -> walk to hut area, low energy -> rest, low social -> seek another sage, low purpose -> meditate)
3. If walking, move one step toward target
4. If near another sage, chance to start a gentle dialogue (2-3 lines from the dialogue bank, displayed as floating text)
5. Temperament influences preferences (e.g., Atri meditates more, Pulastya socializes more)

## 4. Renderer (`renderer.ts`)

Draws onto an HTML Canvas element each frame:

- **Map layer**: Colored tiles in a top-down Mario-style grid
- **Sage sprites**: Small colored circles or simple figures with their name floating above
- **Day/night cycle**: Gradual overlay tint shifting from warm gold (day) to deep blue-teal (night) over ~5 minutes real-time
- **Dialogue bubbles**: Small text near sages when conversing
- **Co-conscious sage**: Highlighted with a subtle glow; camera follows this sage (viewport scrolls to keep them centered)
- **Minimal animation**: Gentle bobbing for sages, subtle water shimmer

## 5. Co-Conscious Mode (`sessionController.ts`)

The user's bound sage behaves autonomously like all others, but at meaningful moments (roughly every 30-60 seconds, or when a decision point arises):

- The simulation pauses gently (other sages continue slowly or freeze)
- A small overlay appears at the bottom with 2-3 calm options, e.g.:
  - "Sit by the river" / "Walk toward the forest" / "Visit Marichi"
  - "Rest beneath the tree" / "Continue along the path"
- User selects one; the sage's target/state updates accordingly
- If the user doesn't respond within ~15 seconds, the sage chooses on its own

## 6. Session Lifecycle

- **Init**: On valid code entry, create world + agents, start tick loop, begin rendering
- **Running**: Tick loop runs at ~4 ticks/second. Canvas redraws each frame via `requestAnimationFrame`
- **Exit**: On `beforeunload` or a small exit button, stop loop, clear all references, fade canvas to black
- No summaries, no scores, no goodbye message -- just silence

## 7. Routing & Navigation

- Add `/mayaworld` route in `App.tsx`
- Add "Mayaworld" to the navigation bar in `Navigation.tsx`
- The Mayaworld page renders fullscreen (no Navigation/Footer visible once inside the simulation -- only on the entry screen)

---

## Technical Details

**Files to create:**

| File | Purpose |
|---|---|
| `src/pages/Mayaworld.tsx` | Entry screen + canvas host, manages session state |
| `src/mayaworld/constants.ts` | Access codes, sage names/temperaments, tile colors, config |
| `src/mayaworld/types.ts` | Interfaces for World, Sage, Tile, Needs, etc. |
| `src/mayaworld/worldGenerator.ts` | Procedural island generation returning a tile grid |
| `src/mayaworld/agentEngine.ts` | Sage behavior: need updates, decision-making, movement, dialogue |
| `src/mayaworld/renderer.ts` | Canvas drawing: map tiles, sages, day/night, dialogue bubbles |
| `src/mayaworld/sessionController.ts` | Tick loop, co-conscious prompt logic, init/cleanup |
| `src/mayaworld/dialogueBank.ts` | Array of gentle dialogue lines for sage conversations |

**Files to modify:**

| File | Change |
|---|---|
| `src/App.tsx` | Add `/mayaworld` route |
| `src/components/Navigation.tsx` | Add "Mayaworld" nav link |

**No new dependencies required.** Everything uses React, HTML Canvas API, and vanilla JS/TS.

**No backend or database changes.**

---

## Visual Style Notes

- The entry screen matches Manomaya's dark teal + gold aesthetic
- The simulation canvas uses a brighter, warmer Mario-inspired palette (greens, blues, browns, golds) while keeping the overall feeling calm
- Typography inside the simulation (sage names, dialogue) uses the existing Cormorant Garamond / Outfit fonts
- The co-conscious choice overlay uses a translucent dark panel with soft gold text
