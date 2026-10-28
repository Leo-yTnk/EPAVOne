import { fullMotion } from './performanceMode.js';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { motionDuration, reducedMotion } from './motion.js';

// Replace content immediately; animate its container, never retain stale controls.
export function useContentMotion(ref, contentKey, depth = 0, axis = 'x') {
  const previous = useRef(null);
  const running = useRef(null);
  useLayoutEffect(() => () => running.current?.stop(), []);
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { contentKey, depth };
    const node = ref.current;
    if (!before || before.contentKey === contentKey) return;
    if (!node?.animate || reducedMotion() || !fullMotion()) {
      running.current?.stop();
      return;
    }
    // A whole-catalog opacity/transform creates a very large composited surface.
    // Keep bulk result replacement immediate instead of animating pages of cards.
    if (axis === 'y' && node.scrollHeight > window.innerHeight * 2) {
      running.current?.stop();
      return;
    }
    // Rapid typing updates the results immediately and lets the existing arrival
    // settle. Restarting its offset/opacity on every keystroke creates a tremor.
    if (axis === 'y' && running.current?.node === node && running.current.animation.playState === 'running') return;
    running.current?.stop();
    const direction = depth < before.depth ? -1 : 1;
    const animation = node.animate(
      [
        { opacity: axis === 'y' ? 0.85 : 0.6, transform: axis === 'y' ? 'translateY(4px)' : `translateX(${6 * direction}px)` },
        { opacity: 1, transform: axis === 'y' ? 'translateY(0)' : 'translateX(0)' }
      ],
      {
        duration: motionDuration(node, '--duration-normal', 220),
        easing: getComputedStyle(node).getPropertyValue('--ease-standard').trim() || 'ease-out'
      }
    );
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const stop = () => {
      animation.cancel();
      observer.disconnect();
      media?.removeEventListener?.('change', stop);
      window.removeEventListener('resize', stop);
      if (running.current?.animation === animation) running.current = null;
    };
    const observer = new MutationObserver(stop);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced-motion', 'data-performance-mode'] });
    media?.addEventListener?.('change', stop);
    window.addEventListener('resize', stop);
    running.current = { node, animation, stop };
    animation.onfinish = stop;
  }, [ref, contentKey, depth, axis]);
}
