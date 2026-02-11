

# Mayaworld Revamp -- Advanced Interactive Simulation

A complete overhaul of the Mayaworld experience: redesigned entry, cloud transition, dual Observe/Authority modes with direct movement and sage interaction, improved rendering, and floating narration.

---

## Overview of Changes

The current version is minimal -- a code input, a canvas with colored circles, and periodic co-conscious prompts. The revamp transforms it into a rich, interactive spiritual simulation with two distinct user modes, better visuals, and a ceremonial entry experience.

---

## 1. Redesigned Entry Screen

Replace the current sparse entry with a full ceremonial intro:

- Slowly appearing poetic text (staggered fade-in animation, line by line)
- Full sage roster displayed with codes and one-line temperaments:
  - 1111 -- Bhrigu -- grounded observer
  - 2222 -- Pulastya -- wandering thinker
  - 3333 -- Pulaha -- gentle listener
  - 4444 -- Kratu -- disciplined mover
  - 5555 -- Angiras -- curious explorer
  - 6666 -- Marichi -- quiet contemplator
  - 7777 -- Atri -- empathic presence
  - 8888 -- Vashistha -- steady guide
  - 9999 -- Daksha -- structured planner
- Code input field and a styled "ENTER THE MAYAWORLD" button
- Dark background with Manomaya teal/gold palette

## 2. Cloud Transition

After clicking Enter:
- Canvas fills with animated cloud shapes (layered semi-transparent ovals drifting)
- Over 3-5 seconds, clouds part (opacity fades, y-positions shift apart)
- The world gradually appears beneath
- No loading bar -- feels like the world was always there, just hidden

Implemented as a short canvas-based animation phase before the main simulation starts.

## 3. Dual Mode System (Observe / Authority)

After the cloud transition completes, show a small centered mode selection overlay:

### Observe Mode
- Camera follows the bound sage autonomously
- User cannot move or interact
- Floating narration text appears at the bottom periodically:
  - "Pulaha pauses beneath the trees."
  - "Angiras watches the river."
  - Generated from sage state + name + location context
- The co-conscious prompt system is removed in this mode

### Authority Mode
- User gains direct control of their bound sage
- WASD / Arrow key movement (desktop)
- Tap-to-move on mobile (tap a location, sage walks there)
- Other 8 sages remain fully autonomous
- When near another sage (within 2 tiles), an interact button/key prompt appears
- Pressing interact opens a dialog panel showing:
  - The other sage's name and current mood
  - A one-line thought (from dialogue bank)
  - 2 interaction options (e.g., "Sit together", "Walk with them", "Remain silent")
  - Sages respond with a dialogue line based on the choice

## 4. Improved Renderer

Upgrade the canvas drawing significantly:

- **Sage sprites**: Draw simple rishi-style figures instead of plain circles:
  - Small head circle
  - Triangular robe body in the sage's color
  - Subtle circular aura/halo glow behind each sage
  - Tiny walking animation (slight body sway based on movement)
- **Better tile details**:
  - Flowers/grass tufts on grass tiles
  - Improved tree shapes with layered canopy
  - Water with animated wave lines
  - Huts with more detail (door, window dots)
  - Clearing with soft golden glow particles
- **Narration text rendering**: Soft text at bottom center of canvas for observe mode narration
- **Interaction UI**: Dialog panel rendered as canvas overlay or DOM element positioned over canvas

## 5. Updated Types and Constants

- Add `description` field to sage definitions (one-line temperaments)
- Add personality weights: `curiosity`, `calm`, `movementTendency` to Sage type
- Add `mode` to session: `'observe' | 'authority'`
- Add `userControlled` flag to Sage to distinguish user-driven movement from AI
- Add narration text arrays for observe mode

## 6. Updated Session Controller

- Remove the co-conscious prompt system (replaced by mode-based interaction)
- Add keyboard input handling for authority mode (WASD/arrows)
- Add touch/tap input handling for mobile
- Add mode switching logic
- Add narration timer for observe mode (show a new narration every 8-15 seconds)

## 7. UI Overlay Elements

Minimal DOM overlays on top of the canvas:
- **Top left**: Current sage name (existing, keep)
- **Top right**: "Leave World" button (existing, keep)
- **Bottom center**: Narration text (observe mode) or interaction panel (authority mode)
- **Mode switch**: Small button to toggle between Observe/Authority after initial selection
- No minimap, no clutter

## 8. Session End

- On leave: fade canvas to black over 1.5 seconds
- Stop all loops, clear state
- No summary, no goodbye text, just darkness

---

## Technical Details

### Files to Modify

| File | Changes |
|---|---|
| `src/mayaworld/types.ts` | Add personality weights, mode type, narration types, interaction types |
| `src/mayaworld/constants.ts` | Add sage descriptions, narration templates, personality weight defaults |
| `src/mayaworld/renderer.ts` | Complete rewrite: rishi-style sprites, improved tiles, aura glow, narration rendering |
| `src/mayaworld/agentEngine.ts` | Add personality weight influence, skip AI tick when sage is user-controlled |
| `src/mayaworld/sessionController.ts` | Remove co-conscious prompts, add mode management, keyboard/touch input, narration timer |
| `src/mayaworld/dialogueBank.ts` | Add narration templates and interaction response lines |
| `src/pages/Mayaworld.tsx` | Complete rewrite: new entry screen, cloud transition, mode selection, authority controls, interaction panel |

### No new dependencies required

All rendering uses HTML Canvas API. Input handling uses native keyboard/touch events. Animations use requestAnimationFrame.

### No backend or database changes

Everything remains purely client-side and ephemeral.

