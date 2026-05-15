// Persistent UI prefs for Mayaworld (zoom, HUD, minimap, reduce motion)
const KEY = 'mayaworld:prefs:v1';

export interface MayaPrefs {
  zoom?: number;
  hudExpanded?: boolean;
  showMinimap?: boolean;
  reduceMotion?: boolean;
}

export function loadPrefs(): MayaPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

let writeTimer: number | undefined;
export function savePrefs(patch: MayaPrefs) {
  if (typeof window === 'undefined') return;
  if (writeTimer) window.clearTimeout(writeTimer);
  writeTimer = window.setTimeout(() => {
    try {
      const cur = loadPrefs();
      localStorage.setItem(KEY, JSON.stringify({ ...cur, ...patch }));
    } catch { /* storage blocked */ }
  }, 200);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}
