import { useLayoutEffect, useRef } from 'preact/hooks';
import { motionDuration, reducedMotion } from './motion.js';

// Replace content immediately; animate only its arrival, never retain stale controls.
export function useContentMotion(ref, contentKey, depth = 0, axis = 'x') {
  const previous = useRef(null);
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { contentKey, depth };
    const node = ref.current;
    if (!before || before.contentKey === contentKey || !node?.animate || reducedMotion()) return;
    const direction = depth < before.depth ? -1 : 1;
    const offset = axis === 'y' ? 'translateY(4px)' : `translateX(${6 * direction}px)`;
    const settled = axis === 'y' ? 'translateY(0)' : 'translateX(0)';
    const animation = node.animate(
      [
        { opacity: axis === 'y' ? 0.85 : 0.6, transform: offset },
        { opacity: 1, transform: settled }
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
  }, [ref, contentKey, depth, axis]);
}
