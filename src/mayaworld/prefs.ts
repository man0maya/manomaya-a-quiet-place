// Persistent UI prefs for Mayaworld (zoom, HUD, minimap)
const KEY = 'mayaworld:prefs:v1';

export interface MayaPrefs {
  zoom?: number;
  hudExpanded?: boolean;
  showMinimap?: boolean;
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
