import { useLayoutEffect, useState } from 'preact/hooks';

import { anchoredPosition } from './anchoredPosition.js';

export function useAnchoredLayer(triggerRef, layerRef, open, { offset = 8, minWidth = 0, matchWidth = false, placement = 'auto' } = {}) {
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }

    function update() {
      const trigger = triggerRef.current;
      const layer = layerRef.current;
      if (!trigger || !layer) return;

      const visual = window.visualViewport;
      const next = anchoredPosition(
        trigger.getBoundingClientRect(),
        { width: layer.offsetWidth, height: layer.scrollHeight },
        {
          left: visual?.offsetLeft ?? 0,
          top: visual?.offsetTop ?? 0,
          width: visual?.width ?? window.innerWidth,
          height: visual?.height ?? window.innerHeight,
          layoutHeight: window.innerHeight
        },
        { offset, minWidth, matchWidth, placement }
      );
      setPosition((current) =>
        current?.side === next.side && Object.entries(next.style).every(([key, value]) => current.style[key] === value) ? current : next
      );
    }

    let frame = null;
    const schedule = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        update();
      });
    };
    const visual = window.visualViewport;
    update();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    visual?.addEventListener('resize', schedule);
    visual?.addEventListener('scroll', schedule);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      visual?.removeEventListener('resize', schedule);
      visual?.removeEventListener('scroll', schedule);
    };
  }, [layerRef, matchWidth, minWidth, offset, open, placement, triggerRef]);

  return position;
}
