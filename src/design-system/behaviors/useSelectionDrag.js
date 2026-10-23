import { useLayoutEffect, useRef } from 'preact/hooks';
import { selectionGeometry } from './selectionGeometry.js';

// Drag the decorative thumb; only commit the existing button/link on release.
// The targets keep their real layout and the app never changes mid-gesture.
export function useSelectionDrag(containerRef, enabled, value, orientation = 'horizontal') {
  const suppression = useRef(false);
  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = container?.querySelector('.ds-selection-indicator');
    if (!enabled || !container || !indicator) return;
    const vertical = orientation === 'vertical';
    const axis = vertical ? 'y' : 'x';
    const size = vertical ? 'height' : 'width';
    let gesture = null;
    let frame = 0;
    const clearPreview = () => {
      cancelAnimationFrame(frame);
      delete indicator.dataset.dragging;
      delete container.dataset.selectionDragging;
      for (const name of ['x', 'y', 'width', 'height']) indicator.style.removeProperty(`--selection-drag-${name}`);
    };
    const captureRelease = (pointerId) => {
      if (container.hasPointerCapture?.(pointerId)) container.releasePointerCapture(pointerId);
    };
    const cancel = () => {
      const current = gesture;
      gesture = null;
      if (current?.dragging) suppression.current = true;
      if (current) captureRelease(current.pointerId);
      clearPreview();
    };
    const down = (event) => {
      suppression.current = false;
      if (event.button !== 0 || event.isPrimary === false || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const selected = container.querySelector('[aria-selected="true"], [aria-current="page"]');
      if (!selected?.contains(event.target) || selected.matches(':disabled, [aria-disabled="true"]')) return;
      clearPreview();
      const slots = [...container.querySelectorAll('[role="tab"], a[href]')]
        .filter((node) => !node.matches(':disabled, [aria-disabled="true"]'))
        .map((node) => ({ node, ...selectionGeometry(container, node) }))
        .filter((box) => box.width > 0 && box.height > 0)
        .sort((a, b) => a[axis] - b[axis]);
      const origin = slots.find((slot) => slot.node === selected);
      if (!origin || slots.length < 2) return;
      gesture = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        origin,
        slots,
        target: origin,
        dragging: false
      };
    };
    const move = (event) => {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      const delta = vertical ? dy : dx;
      const cross = vertical ? dx : dy;
      if (!gesture.dragging) {
        if (Math.abs(cross) > 6 && Math.abs(cross) >= Math.abs(delta)) {
          cancel();
          return;
        }
        if (Math.abs(delta) < 6) return;
        gesture.dragging = true;
        container.setPointerCapture?.(event.pointerId);
        container.dataset.selectionDragging = 'true';
        indicator.dataset.dragging = 'true';
        document.dispatchEvent(new Event('ds-selection-drag-start'));
      }
      if (event.cancelable) event.preventDefault();
      const { slots, origin } = gesture;
      const centerOf = (slot) => slot[axis] + slot[size] / 2;
      const center = Math.max(centerOf(slots[0]), Math.min(centerOf(slots.at(-1)), centerOf(origin) + delta));
      let before = slots[0];
      let after = slots.at(-1);
      for (const slot of slots) {
        if (centerOf(slot) <= center) before = slot;
        if (centerOf(slot) >= center) {
          after = slot;
          break;
        }
      }
      const span = centerOf(after) - centerOf(before);
      const progress = span ? (center - centerOf(before)) / span : 0;
      const preview = {};
      for (const name of ['x', 'y', 'width', 'height']) preview[name] = before[name] + (after[name] - before[name]) * progress;
      gesture.target = slots.reduce(
        (nearest, slot) => (Math.abs(centerOf(slot) - center) < Math.abs(centerOf(nearest) - center) ? slot : nearest),
        origin
      );
      for (const [name, number] of Object.entries(preview)) indicator.style.setProperty(`--selection-drag-${name}`, `${number}px`);
    };
    const up = (event) => {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      const current = gesture;
      gesture = null;
      captureRelease(current.pointerId);
      if (!current.dragging) return;
      suppression.current = true;
      // Preserve the visual position until the new route's layout is committed.
      delete indicator.dataset.dragging;
      delete container.dataset.selectionDragging;
      frame = requestAnimationFrame(clearPreview);
      const target = current.target.node;
      if (target !== current.origin.node && target.isConnected && !target.matches(':disabled, [aria-disabled="true"]')) {
        target.focus({ preventScroll: true });
        target.click();
      }
    };
    const click = (event) => {
      if (suppression.current && event.detail > 0 && container.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        suppression.current = false;
      }
    };
    const pointerCancel = (event) => {
      // Touch begins with implicit capture on the tab. Transferring it to
      // the track emits lostpointercapture on that tab, not a cancellation.
      if (event.type === 'lostpointercapture' && event.target !== container) return;
      if (gesture?.pointerId === event.pointerId) cancel();
    };
    const key = (event) => {
      if (gesture && event.key === 'Escape') {
        event.preventDefault();
        cancel();
      }
    };
    const dragStart = (event) => {
      if (gesture) event.preventDefault();
    };
    const visibility = () => {
      if (document.hidden) cancel();
    };
    container.dataset.selectionDragOrientation = vertical ? 'vertical' : 'horizontal';
    container.addEventListener('pointerdown', down);
    container.addEventListener('dragstart', dragStart);
    container.addEventListener('lostpointercapture', pointerCancel);
    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', pointerCancel);
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', cancel);
    window.addEventListener('scroll', cancel, true);
    return () => {
      cancel();
      delete container.dataset.selectionDragOrientation;
      container.removeEventListener('pointerdown', down);
      container.removeEventListener('dragstart', dragStart);
      container.removeEventListener('lostpointercapture', pointerCancel);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', pointerCancel);
      document.removeEventListener('click', click, true);
      document.removeEventListener('keydown', key);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', cancel);
      window.removeEventListener('resize', cancel);
      window.removeEventListener('scroll', cancel, true);
    };
  }, [containerRef, enabled, value, orientation]);
}
