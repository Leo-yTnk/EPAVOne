export const DEFAULT_PREFERENCES = {
  navigation: 'horizontal',
  mobileNavigation: 'horizontal',
  density: 'comfortable',
  reducedMotion: false,
  displayName: '',
  textSize: 'standard',
  showGrid: true,
  homeBackground: 'adaptive',
  showInspiration: true,
  showWeeklyReminder: true,
  homeAction: 'planner'
};
const KEY = 'epavone-preferences';
export function normalizePreferences(saved = {}) {
  if (!saved || typeof saved !== 'object') saved = {};
  const preferences = { ...DEFAULT_PREFERENCES };
  const choices = {
    navigation: ['horizontal', 'vertical'],
    mobileNavigation: ['horizontal', 'vertical'],
    density: ['comfortable', 'compact'],
    textSize: ['standard', 'large'],
    homeBackground: ['adaptive', 'neutral'],
    homeAction: ['planner', 'insights', 'writer']
  };
  for (const [key, values] of Object.entries(choices)) {
    if (values.includes(saved[key])) preferences[key] = saved[key];
  }
  for (const key of ['reducedMotion', 'showGrid', 'showInspiration', 'showWeeklyReminder']) {
    if (typeof saved[key] === 'boolean') preferences[key] = saved[key];
  }
  if (typeof saved.displayName === 'string') preferences.displayName = saved.displayName.trim().slice(0, 40);
  return preferences;
}
export function readPreferences() {
  try {
    return normalizePreferences(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}
export function applyPreferences(input) {
  const preferences = normalizePreferences(input);
  const root = document.documentElement;
  root.dataset.density = preferences.density;
  root.dataset.reducedMotion = String(preferences.reducedMotion);
  root.dataset.textSize = preferences.textSize;
  root.dataset.showGrid = String(preferences.showGrid);
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}
