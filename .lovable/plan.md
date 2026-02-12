

# Mayaworld Revamp -- Pokemon-Style Spiritual Simulation

Transform Mayaworld into a Gameboy/Pokemon-inspired 16x16 tile world with grid-based movement, an action/item system, location-based resources, and mystical tasks -- while keeping the spiritual, non-game tone.

---

## What Changes

### Architecture Stays the Same
- Tile map world
- Characters with needs
- Action system
- AI decision loop
- DOM overlays for interaction

### What Changes
- Art style: 16x16 pixel tiles, Pokemon top-down aesthetic
- Tile size reduced from 24px to 16px
- New terrain types: mountain, flower field, sacred grove, temple, beach, ruins, lake
- Action/task system (eat fruit, meditate, pray, gift, search, craft offering)
- Item inventory (simple list of collected items)
- Location resources with rarity and mystical aura values
- Grid-snapped 4-direction movement (one tile per input, no diagonal)
- Static camera (screen follows player, classic RPG style)

---

## 1. Updated Types (`types.ts`)

New tile types added: `'mountain' | 'temple' | 'flower' | 'grove' | 'beach' | 'ruins' | 'lake'`

New interfaces:
- `Item`: `{ id, name, type: 'fruit' | 'offering' | 'artifact' | 'flower', description }`
- `LocationAura`: `{ mysticalValue: number, resources: ResourceDef[] }` per tile type
- `ResourceDef`: `{ item: string, rarity: number }` -- chance of finding an item
- `SageAction`: `'eat' | 'rest' | 'drink' | 'meditate' | 'pray' | 'gift' | 'talk' | 'search' | 'explore' | 'craft_offering'`
- `Sage` gains: `inventory: Item[]`, `currentAction: SageAction | null`
- `World` gains: `droppedItems: { x, y, item }[]` for items visible on map

### 2. Updated Constants (`constants.ts`)

- `TILE_SIZE` changes from 24 to 16
- `MAP_WIDTH` stays 40, `MAP_HEIGHT` stays 30
- New `TILE_COLORS` entries for mountain, temple, flower, grove, beach, ruins, lake
- New `LOCATION_AURAS` map defining what resources each tile type offers:
  - forest: fruit (common), herb (uncommon)
  - grove: sacred flower (uncommon), blessing (rare)
  - temple: prayer bead (common), mantra scroll (rare)
  - ruins: artifact (rare), ancient text (very rare)
  - mountain: crystal (uncommon), vision (rare)
  - flower: petal (common), nectar (uncommon)
  - lake/river: purified water (common)
  - hut: cooked meal (common)

### 3. Updated World Generator (`worldGenerator.ts`)

Redesigned island layout inspired by the spec:

```text
[Mountain + Shrine/Temple at top]
         |
[Forest] -- [Village Hut cluster]
         |
[Lake] ---- [More Huts]
         |
[Beach + Ruins at bottom]
```

- Mountain tiles clustered at the top with a temple tile
- Forest band in the upper-middle
- Village huts in the center-right
- Lake in the center-left
- Flower fields scattered
- Sacred groves (2-3 small clusters)
- Beach along the bottom edge
- Ruins cluster at bottom-right
- River still cuts through

Generation uses the same noise-based approach but with intentional zone placement.

### 4. Updated Renderer (`renderer.ts`)

All tiles redrawn at 16x16 scale in a Gameboy/Pokemon pixel-art style:

- **Mountain**: Gray triangular peaks with snow caps
- **Temple**: Small shrine structure with red roof accent
- **Flower field**: Green base with colorful pixel flowers
- **Sacred grove**: Dark green with golden particle shimmer
- **Beach**: Sandy yellow with shell dots
- **Ruins**: Gray stone with broken column shapes
- **Lake**: Deep blue with subtle wave animation
- **Existing tiles**: Restyled for 16px (forest trees smaller, huts simplified)

Sage sprites shrunk proportionally for 16x16 grid:
- 3px head circle, small triangular robe, 1px aura

Items on ground rendered as small colored dots/icons on their tile.

Inventory UI: Small overlay panel (top-left, below sage name) showing item count icons when toggled.

Action menu: When player presses E near an actionable tile or sage, a small menu of valid actions appears at the bottom.

### 5. Updated Agent Engine (`agentEngine.ts`)

- Sages can now pick up items from tiles (based on `LOCATION_AURAS` rarity rolls)
- New action decision layer: sages autonomously perform contextual actions:
  - At forest: may search for fruit
  - At temple: may pray
  - At clearing/grove: may meditate
  - At hut: may eat, rest
  - Near another sage: may gift an item, talk
  - At ruins: may search
- `performAction()` function handles action effects on needs:
  - eat: hunger -30
  - rest: energy +40
  - drink: energy +15, hunger -5
  - meditate: purpose -40, energy +10
  - pray: purpose -50
  - gift: social -30 (both sages)
  - search: curiosity-weighted chance to find item
  - craft_offering: consumes 2 items, creates 1 offering

### 6. Updated Session Controller (`sessionController.ts`)

- Grid-snapped movement: pressing a direction key moves exactly 1 tile, with a short cooldown (~200ms) to prevent rapid movement -- classic RPG feel
- Movement cooldown timer prevents holding key = sliding
- Action key (E) now context-sensitive:
  - Near a sage: opens interaction panel (existing)
  - On a resource tile with no sage nearby: opens action menu for that location
  - Example: on forest tile, menu shows "Search for fruit" / "Rest beneath trees"
- New `getAvailableActions()` function returns valid actions based on player position and nearby entities
- Inventory toggle key (I) shows/hides inventory overlay

### 7. Updated Mayaworld Page (`Mayaworld.tsx`)

- Action menu component: replaces interaction dialog at bottom, shows 2-4 context-sensitive action buttons
- Inventory overlay: small panel showing collected items (icon + count), toggleable
- Action feedback: brief narration text when action completes ("You found a ripe fruit among the branches.")
- All existing UI kept (sage name, mode toggle, leave button, narration)
- Mobile: tap on adjacent tile to move; long-press or double-tap to open action menu

### 8. Updated Dialogue Bank (`dialogueBank.ts`)

- Action result narrations added:
  - "You found a ripe fruit among the branches."
  - "The temple hums with an ancient vibration."
  - "Something glints beneath the rubble."
  - "You craft an offering from gathered materials."
- Sage gift responses: "They accept your gift with a gentle nod."
- Location-specific narrations for observe mode

---

## Technical Details

### Files Modified

| File | Changes |
|---|---|
| `src/mayaworld/types.ts` | Add Item, LocationAura, ResourceDef, SageAction types. Extend Sage with inventory/currentAction. Add new TileTypes. |
| `src/mayaworld/constants.ts` | TILE_SIZE to 16. Add new tile colors. Add LOCATION_AURAS config. Add action definitions. |
| `src/mayaworld/worldGenerator.ts` | Zone-based generation with mountain/temple/grove/beach/ruins/lake/flower tiles. |
| `src/mayaworld/renderer.ts` | All tile drawing at 16px Gameboy style. Item rendering on tiles. Smaller sage sprites. |
| `src/mayaworld/agentEngine.ts` | Action system: performAction(), resource gathering, item gifting. Sages autonomously do contextual actions. |
| `src/mayaworld/sessionController.ts` | Grid-snapped movement with cooldown. Context-sensitive E key. getAvailableActions(). Inventory toggle. |
| `src/mayaworld/dialogueBank.ts` | Action result narrations. Location narrations. Gift responses. |
| `src/pages/Mayaworld.tsx` | Action menu UI. Inventory overlay. Action feedback display. Updated mobile controls. |

### No new dependencies

All canvas rendering, no external libraries.

### No backend or database changes

Everything remains client-side and ephemeral.

### Complexity Boundaries

Strictly adhering to:
- 16x16 tiles
- 4-direction grid movement (no diagonal)
- Static follow camera
- Minimal animation (bob, wave lines, shimmer -- no sprite sheets)
- Simple item list (no crafting tree, just combine 2 items into offering)
- Rule-based AI only (no LLM calls for sage behavior)

