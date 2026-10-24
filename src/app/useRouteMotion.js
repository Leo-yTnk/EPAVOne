import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { motionDuration, reducedMotion } from '../design-system/behaviors/motion.js';
const products = ['home', 'insights', 'planner', 'writer', 'settings'];
export function useRouteMotion(ref, routeKey, product) {
  const previous = useRef(null);
  const running = useRef(null);
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { routeKey, product };
    running.current?.cancel();
    const node = ref.current;
    if (!before || before.routeKey === routeKey || !node?.animate || reducedMotion()) return;
    node.classList.add('has-route-motion');
    const arrive = () => {
      const direction = products.indexOf(product) < products.indexOf(before.product) ? -1 : 1;
      const rect = node.getBoundingClientRect();
      const room = direction > 0 ? window.innerWidth - rect.right : rect.left;
      const distance = rect.width ? Math.max(0, Math.min(18, room)) : 18;
      running.current = node.animate(
        [
          { translate: `${distance * direction}px 0`, opacity: 0.72 },
          { translate: '0px 0', opacity: 1 }
        ],
        {
          duration: motionDuration(node, '--duration-slow', 320),
          easing: getComputedStyle(node).getPropertyValue('--ease-standard').trim() || 'ease-out'
        }
      );
    };
    // Lazy apps must animate the app, not an already-disappeared loading spinner.
    let pending;
    if (node.querySelector('[data-route-loading]')) {
      pending = new MutationObserver(() => {
        if (node.querySelector('[data-route-loading]')) return;
        pending.disconnect();
        if (!reducedMotion()) arrive();
      });
      pending.observe(node, { childList: true, subtree: true });
    } else arrive();
    return () => {
      pending?.disconnect();
      running.current?.cancel();
      node.classList.remove('has-route-motion');
    };
  }, [ref, routeKey, product]);
  useEffect(() => {
    const stop = () => running.current?.cancel();
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
  }, []);
}
