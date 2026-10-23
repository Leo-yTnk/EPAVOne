export function reducedMotion() {
  return (
    document.documentElement.dataset.reducedMotion === 'true' || Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  );
}
export function motionDuration(node, token, fallback) {
  const value = getComputedStyle(node).getPropertyValue(token).trim();
  const duration = parseFloat(value);
  return Number.isFinite(duration) ? duration * (value.endsWith('ms') ? 1 : 1000) : fallback;
}

let interactionOrigin = null;
export function rememberMotionOrigin(node) {
  const source = node?.closest('[data-dialog-origin]');
  interactionOrigin = source ? { rect: source.getBoundingClientRect(), time: performance.now() } : null;
}
export function consumeMotionOrigin() {
  const origin = interactionOrigin;
  interactionOrigin = null;
  return origin && performance.now() - origin.time < 1000 ? origin.rect : null;
}
