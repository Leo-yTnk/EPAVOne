import { useLayoutEffect, useRef } from 'preact/hooks';
import { motionDuration, reducedMotion } from './motion.js';

// Replace content immediately; animate only its arrival, never retain stale controls.
export function useContentMotion(ref, contentKey, depth = 0) {
  const previous = useRef(null);
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { contentKey, depth };
    const node = ref.current;
    if (!before || before.contentKey === contentKey || !node?.animate || reducedMotion()) return;
    const direction = depth < before.depth ? -1 : 1;
    const animation = node.animate(
      [
        { opacity: 0.6, transform: `translateX(${6 * direction}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ],
      {
        duration: motionDuration(node, '--duration-normal', 220),
        easing: getComputedStyle(node).getPropertyValue('--ease-standard').trim() || 'ease-out'
      }
    );
    const stop = () => animation.cancel();
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const observer = new MutationObserver(stop);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced-motion'] });
    media?.addEventListener?.('change', stop);
    window.addEventListener('resize', stop);
    return () => {
      stop();
      observer.disconnect();
      media?.removeEventListener?.('change', stop);
      window.removeEventListener('resize', stop);
    };
  }, [ref, contentKey, depth]);
}
