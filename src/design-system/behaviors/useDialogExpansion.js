import { useLayoutEffect, useRef } from 'preact/hooks';
import { consumeMotionOrigin, motionDuration, reducedMotion } from './motion.js';

// Keep the dialog at its real dimensions throughout arrival. Scaling a small
// catalog thumbnail into a tall sheet stretches text and images, especially on mobile.
export function useDialogExpansion(ref, open, enabled) {
  const origin = useRef(null);
  useLayoutEffect(() => {
    if (!open || !enabled) return undefined;
    const source = document.activeElement?.closest('[data-dialog-origin]');
    origin.current = consumeMotionOrigin() || source?.getBoundingClientRect();
    const node = ref.current;
    const from = origin.current;
    if (!node || !from || !from.width || !from.height || !node.animate || reducedMotion()) {
      return undefined;
    }
    node.classList.add('ds-dialog-expanding');
    const to = node.getBoundingClientRect();
    if (!to.width || !to.height) {
      node.classList.remove('ds-dialog-expanding');
      return undefined;
    }
    const styles = getComputedStyle(node);
    const duration = motionDuration(node, '--duration-normal', 220);
    const offsetX = Math.max(-6, Math.min(6, (from.left + from.width / 2 - to.left - to.width / 2) * 0.04));
    const animation = node.animate(
      [
        {
          transform: `translate(${offsetX}px, 12px)`,
          opacity: 0.8
        },
        { transform: 'translate(0, 0)', opacity: 1 }
      ],
      { duration, easing: styles.getPropertyValue('--ease-standard').trim() || 'ease-out' }
    );
    const stop = () => animation.cancel();
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    media?.addEventListener?.('change', stop);
    const observer = new MutationObserver(stop);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced-motion'] });
    return () => {
      observer.disconnect();
      media?.removeEventListener?.('change', stop);
      animation.cancel();
      node.classList.remove('ds-dialog-expanding');
    };
  }, [ref, open, enabled]);
}
