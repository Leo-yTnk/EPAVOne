// One observer serves all mounted decorative surfaces. ResizeObserver already
// batches entries before paint; consumers avoid measuring the layout again.
let observer;
const subscribers = new Map();
export function observeSize(element, callback) {
  if (typeof ResizeObserver === 'undefined') return () => {};
  if (!observer)
    observer = new ResizeObserver((entries) => {
      // Consumers may return a write step. Read the entire batch before changing
      // styles so a shelf of cards does not force a layout flush per stitch.
      const writes = [];
      for (const entry of entries) {
        const write = subscribers.get(entry.target)?.(entry.contentRect);
        if (typeof write === 'function') writes.push(write);
      }
      writes.forEach((write) => write());
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
