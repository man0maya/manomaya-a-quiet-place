// Isometric projection helpers (2:1 diamond)
export const ISO_TILE_W = 32;   // diamond width
export const ISO_TILE_H = 16;   // diamond height
export const ISO_ELEV = 8;      // side-wall height for raised tiles

export function gridToScreen(gx: number, gy: number) {
  return {
    sx: (gx - gy) * (ISO_TILE_W / 2),
    sy: (gx + gy) * (ISO_TILE_H / 2),
  };
}

// Inverse: convert screen-space (relative to world origin) back to fractional grid coords
export function screenToGrid(sx: number, sy: number) {
  const gx = (sx / (ISO_TILE_W / 2) + sy / (ISO_TILE_H / 2)) / 2;
  const gy = (sy / (ISO_TILE_H / 2) - sx / (ISO_TILE_W / 2)) / 2;
  return { gx, gy };
}

// Tiles whose silhouette extends above the diamond (rendered with side walls + canopy)
export const RAISED: Record<string, number> = {
  forest: 10, grove: 12, mountain: 14, temple: 16, shrine: 10,
  hut: 9, village: 10, ruins: 8, cave: 10,
};
