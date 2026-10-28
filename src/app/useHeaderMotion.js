import { fullMotion } from '../design-system/behaviors/performanceMode.js';
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';

function measure(node) {
  const rect = node.getBoundingClientRect();
  const scroll = node.querySelector('.workspace-navigation-scroll');
  return {
    width: rect.width,
    sections: Boolean(node.querySelector('.product-section-nav')),
    items: new Map(
      [...node.querySelectorAll('[role="tab"]')].map((item) => [
        item.id,
        (item.querySelector('.app-tab-label') || item).getBoundingClientRect().left - rect.left + scroll.scrollLeft
      ])
    )
  };
}

// Animate the small shell island only; content keeps its real size and remains interactive.
export function useHeaderMotion(ref, product, horizontal) {
  const previous = useRef(null);
  const running = useRef([]);
  const frame = useRef(0);
  const stop = () => {
    cancelAnimationFrame(frame.current);
    running.current.forEach((animation) => animation.cancel());
    running.current = [];
  };

  useLayoutEffect(() => {
    const node = ref.current;
    const before = previous.current;
    stop();
    if (!node || !horizontal) {
      previous.current = null;
      return;
    }
    const after = measure(node);
    previous.current = after;
    const reduced =
      document.documentElement.dataset.reducedMotion === 'true' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!before || reduced || !fullMotion() || !node.animate) return;

    const style = getComputedStyle(node);
    const duration = parseFloat(style.getPropertyValue('--duration-slow')) || 320;
    const easing = style.getPropertyValue('--ease-emphasized').trim() || 'ease-out';
    const options = { duration, easing };
    if (Math.abs(before.width - after.width) >= 1) {
      running.current.push(node.animate([{ width: `${before.width}px` }, { width: `${after.width}px` }], options));
    }
    for (const item of node.querySelectorAll('[role="tab"]')) {
      const start = before.items.get(item.id);
      const end = after.items.get(item.id);
      if (start !== undefined && Math.abs(start - end) > 1) {
        const label = item.querySelector('.app-tab-label') || item;
        running.current.push(label.animate([{ translate: `${start - end}px 0` }, { translate: '0px 0' }], options));
      }
    }
    const sections = node.querySelector('.product-section-nav');
    if (sections) {
      running.current.push(
        sections.animate(
          [
            { opacity: 0, translate: 'var(--motion-distance-md) 0' },
            { opacity: 1, translate: '0px 0' }
          ],
          options
        )
      );
    } else if (before.sections) {
      for (const label of node.querySelectorAll('.app-tab-name')) {
        running.current.push(label.animate([{ opacity: 0 }, { opacity: 1 }], options));
      }
    }
    // Retarget rapid app changes from the currently visible width and positions.
    const sample = () => {
      previous.current = measure(node);
      if (running.current.some((animation) => animation.playState === 'running')) frame.current = requestAnimationFrame(sample);
    };
    frame.current = requestAnimationFrame(sample);
  }, [ref, product, horizontal]);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const reset = () => {
      stop();
      previous.current = ref.current ? measure(ref.current) : null;
    };
    const observer = new MutationObserver(reset);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced-motion', 'data-performance-mode'] });
    window.addEventListener('resize', reset);
    media?.addEventListener('change', reset);
    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener('resize', reset);
      media?.removeEventListener('change', reset);
    };
  }, [ref]);
}
