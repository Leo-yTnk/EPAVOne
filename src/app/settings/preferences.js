export const DEFAULT_PREFERENCES = { navigation: 'horizontal', density: 'comfortable', reducedMotion: false };
const KEY = 'epavone-preferences';
export function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || {};
    return {
      navigation: saved.navigation === 'vertical' ? 'vertical' : 'horizontal',
      density: saved.density === 'compact' ? 'compact' : 'comfortable',
      reducedMotion: saved.reducedMotion === true
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}
export function applyPreferences(preferences) {
  document.documentElement.dataset.density = preferences.density;
  document.documentElement.dataset.reducedMotion = String(preferences.reducedMotion);
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences));
  } catch {
    /* Private storage may be unavailable. */
  }
}
