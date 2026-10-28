export const DEFAULT_PREFERENCES = {
  navigation: 'horizontal',
  mobileNavigation: 'horizontal',
  density: 'comfortable',
  reducedMotion: false,
  performanceMode: 'balanced',
  displayName: '',
  textSize: 'standard',
  showGrid: true,
  homeBackground: 'adaptive',
  showInspiration: true,
  showWeeklyReminder: true,
  homeAction: 'planner',
  startPage: 'home',
  contentWidth: 'standard',
  stitchStyle: 'default',
  contrast: 'standard',
  showBreadcrumbs: true
};
const KEY = 'epavone-preferences';
export function normalizePreferences(saved = {}) {
  if (!saved || typeof saved !== 'object') saved = {};
  const preferences = { ...DEFAULT_PREFERENCES };
  const choices = {
    startPage: ['home', 'planner', 'insights', 'writer'],
    contentWidth: ['focused', 'standard', 'wide'],
    stitchStyle: ['default', 'subtle', 'none'],
    contrast: ['standard', 'high'],
    performanceMode: ['performance', 'balanced', 'fabulous'],
    navigation: ['horizontal', 'vertical'],
    mobileNavigation: ['horizontal', 'vertical'],
    density: ['comfortable', 'compact'],
    textSize: ['standard', 'large'],
    homeBackground: ['adaptive', 'neutral', 'dawn', 'morning', 'afternoon', 'evening', 'night'],
    homeAction: ['planner', 'insights', 'writer']
  };
  for (const [key, values] of Object.entries(choices)) {
    if (values.includes(saved[key])) preferences[key] = saved[key];
  }
  for (const key of ['reducedMotion', 'showGrid', 'showInspiration', 'showWeeklyReminder', 'showBreadcrumbs']) {
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
  root.dataset.performanceMode = preferences.performanceMode;
  root.dataset.reducedMotion = String(preferences.reducedMotion || preferences.performanceMode === 'performance');
  if (root.dataset.reducedMotion === 'true') document.getAnimations?.().forEach((animation) => animation.cancel());
  root.dataset.contentWidth = preferences.contentWidth;
  root.dataset.stitchStyle = preferences.stitchStyle;
  root.dataset.contrast = preferences.contrast;
  root.dataset.showBreadcrumbs = String(preferences.showBreadcrumbs);
  root.dataset.textSize = preferences.textSize;
  root.dataset.showGrid = String(preferences.showGrid);
  try {
    localStorage.setItem(KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

// Only a bare entry URL uses this choice; explicit Home and shared links win.
export function initialRouteHash(hash, preferences) {
  if (hash && hash !== '#') return hash;
  return preferences.startPage && preferences.startPage !== 'home' ? '#/' + preferences.startPage : '#/';
}
