// One observer serves all mounted decorative surfaces. ResizeObserver already
// batches entries before paint; consumers avoid measuring the layout again.
let observer;
const subscribers = new Map();
export function observeSize(element, callback) {
  if (typeof ResizeObserver === 'undefined') return () => {};
  if (!observer)
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) subscribers.get(entry.target)?.(entry.contentRect);
    });
  subscribers.set(element, callback);
  observer.observe(element);
  return () => {
    subscribers.delete(element);
    observer?.unobserve(element);
    if (!subscribers.size) {
      observer?.disconnect();
      observer = undefined;
    }
  };
}
