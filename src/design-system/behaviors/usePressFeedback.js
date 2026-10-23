import { useEffect } from 'preact/hooks';
import { motionDuration, reducedMotion, rememberMotionOrigin } from './motion.js';

// Delegation includes portals; individual scale preserves layout transforms.
export function usePressFeedback() {
  useEffect(() => {
    let pressed = null;
    const animations = new Map();
    const stop = (node) => {
      animations.get(node)?.cancel();
      animations.delete(node);
    };
    const clear = () => {
      pressed = null;
      rememberMotionOrigin(null);
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const play = (node, frames, token, fallback) => {
      stop(node);
      if (!node?.animate || reducedMotion()) return;
      const animation = node.animate(frames, { duration: motionDuration(node, token, fallback), easing: 'ease-out', fill: 'forwards' });
      animations.set(node, animation);
      animation.onfinish = () => {
        if (pressed?.node !== node && animations.get(node) === animation) stop(node);
      };
    };
    const down = (event) => {
      if (event.type === 'pointerdown' && (event.button !== 0 || event.isPrimary === false)) return;
      if (event.type === 'keydown' && (event.repeat || !['Enter', ' '].includes(event.key))) return;
      if (event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
      const node = event.target.closest?.('button, a[href], [role="tab"], [data-dialog-origin]');
      if (!node || node.closest(':disabled, [aria-disabled="true"], [aria-busy="true"]')) return;
      rememberMotionOrigin(node);
      if (pressed) {
        stop(pressed.node);
        pressed = null;
      }
      pressed = { node, x: event.clientX, y: event.clientY, pointerId: event.pointerId, key: event.key };
      play(node, [{ scale: getComputedStyle(node).scale || '1' }, { scale: '0.97' }], '--duration-instant', 90);
    };
    const release = (event) => {
      if (!pressed) return;
      if (event.type === 'pointerup' && pressed.pointerId !== event.pointerId) return;
      if (event.type === 'keyup' && pressed.key !== event.key) return;
      const { node } = pressed;
      const scale = getComputedStyle(node).scale || '1';
      pressed = null;
      if (!node.isConnected) {
        stop(node);
        return;
      }
      play(node, [{ scale }, { scale: '1.018', offset: 0.55 }, { scale: '1' }], '--duration-slow', 320);
    };
    const move = (event) => {
      if (pressed?.pointerId === event.pointerId && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 10) clear();
    };
    const focusOut = (event) => {
      if (pressed?.node === event.target && !pressed.node.contains(event.relatedTarget)) clear();
    };
    const visibility = () => {
      if (document.hidden) clear();
    };
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const observer = new MutationObserver(clear);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced-motion'] });
    const listeners = {
      pointerdown: down,
      pointerup: release,
      pointermove: move,
      pointercancel: clear,
      keydown: down,
      keyup: release,
      focusout: focusOut
    };
    Object.entries(listeners).forEach(([name, handler]) => document.addEventListener(name, handler, true));
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', visibility);
    media?.addEventListener?.('change', clear);
    return () => {
      clear();
      observer.disconnect();
      Object.entries(listeners).forEach(([name, handler]) => document.removeEventListener(name, handler, true));
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', visibility);
      media?.removeEventListener?.('change', clear);
    };
  }, []);
}
