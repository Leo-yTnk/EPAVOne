// One observer per loading policy, shared by all catalog slots.
const pools = new Map();
export function observeVisibility(node, margin, callback) {
  if (typeof IntersectionObserver === 'undefined') {
    callback(true);
    return () => {};
  }
  if (!pools.has(margin)) {
    const callbacks = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => callbacks.get(entry.target)?.(entry.isIntersecting));
      },
      { rootMargin: `${margin}px` }
    );
    pools.set(margin, { callbacks, observer });
  }
  const pool = pools.get(margin);
  pool.callbacks.set(node, callback);
  pool.observer.observe(node);
  return () => {
    pool.observer.unobserve(node);
    pool.callbacks.delete(node);
    if (!pool.callbacks.size) {
      pool.observer.disconnect();
      pools.delete(margin);
    }
  };
}
