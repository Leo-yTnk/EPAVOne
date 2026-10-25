import { useLayoutEffect, useState } from 'preact/hooks';
import { motionDuration, reducedMotion } from './motion.js';

// Retain only the visual surface. Callers release focus and interaction immediately.
export function useExitPresence(open) {
  const [retained, setRetained] = useState(open);
  useLayoutEffect(() => {
    if (open) {
      setRetained(true);
      return;
    }
    if (!retained) return;
    if (reducedMotion() || !Element.prototype.animate) {
      setRetained(false);
      return;
    }
    const finish = () => setRetained(false);
    const timer = setTimeout(finish, motionDuration(document.documentElement, '--duration-fast', 150));
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const observer = new MutationObserver(finish);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced-motion'] });
    media?.addEventListener?.('change', finish);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      media?.removeEventListener?.('change', finish);
    };
  }, [open, retained]);
  return open || retained;
}
