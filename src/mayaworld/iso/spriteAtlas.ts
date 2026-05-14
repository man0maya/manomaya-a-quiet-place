// Loads sage character art (one transparent PNG per sage) for use in the iso renderer.
// Falls back gracefully — if sprites aren't loaded yet, the renderer draws procedural sages.

import agni from '@/assets/mayaworld/sages/bhrigu.png';
import pulastya from '@/assets/mayaworld/sages/pulastya.png';
import pulaha from '@/assets/mayaworld/sages/pulaha.png';
import kratu from '@/assets/mayaworld/sages/kratu.png';
import angiras from '@/assets/mayaworld/sages/angiras.png';
import marichi from '@/assets/mayaworld/sages/marichi.png';
import atri from '@/assets/mayaworld/sages/atri.png';
import vashistha from '@/assets/mayaworld/sages/vashistha.png';
import daksha from '@/assets/mayaworld/sages/daksha.png';

const SOURCES: Record<string, string> = {
  Bhrigu: agni,
  Pulastya: pulastya,
  Pulaha: pulaha,
  Kratu: kratu,
  Angiras: angiras,
  Marichi: marichi,
  Atri: atri,
  Vashistha: vashistha,
  Daksha: daksha,
};

const cache: Record<string, HTMLImageElement> = {};
let preloadStarted = false;

export function preloadSageSprites(): Promise<void> {
  if (preloadStarted) return Promise.resolve();
  preloadStarted = true;
  const all = Object.entries(SOURCES).map(([name, src]) => new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => { cache[name] = img; resolve(); };
    img.onerror = () => resolve();
    img.src = src;
  }));
  return Promise.all(all).then(() => undefined);
}

export function getSageSprite(name: string): HTMLImageElement | null {
  return cache[name] || null;
}

// Draw the sage sprite centered horizontally, with feet at (cx, footY).
// Height is the on-screen height in pixels; aspect from the source is preserved.
export function drawSageSprite(
  ctx: CanvasRenderingContext2D,
  name: string,
  cx: number,
  footY: number,
  height: number,
  facingLeft: boolean,
) {
  const img = cache[name];
  if (!img || !img.width) return false;
  const w = (img.width / img.height) * height;
  const x = cx - w / 2;
  const y = footY - height;
  ctx.save();
  // Crisp pixel scaling (the source art is intentionally chunky)
  ctx.imageSmoothingEnabled = false;
  if (facingLeft) {
    ctx.translate(cx, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, y, w, height);
  } else {
    ctx.drawImage(img, x, y, w, height);
  }
  ctx.restore();
  return true;
}
