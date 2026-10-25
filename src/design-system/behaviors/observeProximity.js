let observer;
const subscribers = new Map();

// Decorative work starts before a surface reaches the viewport; layout and
// content remain fully present. One observer serves every mounted stitch.
export function observeProximity(element, callback) {
  if (typeof IntersectionObserver === 'undefined') {
    callback(true);
    return () => {};
  }
  if (!observer)
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) subscribers.get(entry.target)?.(entry.isIntersecting);
      },
      { rootMargin: '600px 0px' }
    );
  subscribers.set(element, callback);
  observer.observe(element);
  return () => {
    subscribers.delete(element);
    observer.unobserve(element);
    if (!subscribers.size) {
      observer.disconnect();
      observer = undefined;
    }
  };
}
