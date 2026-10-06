import { useLayoutEffect, useRef } from 'preact/hooks';

// Measure the initiating card before the modal moves focus. Animate only the
// compositor transform; layout, scrolling and controls are ready immediately.
export function useDialogExpansion(ref, open, enabled) {
  const origin = useRef(null);
  useLayoutEffect(() => {
    if (!open || !enabled) return undefined;
    const source = document.activeElement?.closest('[data-dialog-origin]');
    origin.current = source?.getBoundingClientRect();
    const node = ref.current;
    const from = origin.current;
    if (!node || !from || !from.width || !from.height || !node.animate || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    node.classList.add('ds-dialog-expanding');
    const to = node.getBoundingClientRect();
    if (!to.width || !to.height) {
      node.classList.remove('ds-dialog-expanding');
      return undefined;
    }
    const styles = getComputedStyle(node);
    const duration = parseFloat(styles.getPropertyValue('--duration-normal')) || 220;
    const animation = node.animate(
      [
        {
          transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`,
          opacity: 0.65
        },
        { transform: 'translate(0, 0) scale(1, 1)', opacity: 1 }
      ],
      { duration, easing: styles.getPropertyValue('--ease-standard').trim() || 'ease-out' }
    );
    return () => {
      animation.cancel();
      node.classList.remove('ds-dialog-expanding');
    };
  }, [ref, open, enabled]);
}
