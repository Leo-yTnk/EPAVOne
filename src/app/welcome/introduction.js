const KEY = 'epavone-introduction-v1';
export function hasSeenIntroduction() {
  try {
    return localStorage.getItem(KEY) === 'done';
  } catch {
    return false;
  }
}
export function completeIntroduction() {
  try {
    localStorage.setItem(KEY, 'done');
    return true;
  } catch {
    return false;
  }
}
