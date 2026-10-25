import { useLayoutEffect, useRef } from 'preact/hooks';
import { squirclePath } from '../behaviors/squirclePath.js';
import { observeSize } from '../behaviors/observeSize.js';
import { observeProximity } from '../behaviors/observeProximity.js';

export function CardStitch({ contrast = false }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    let lastWidth, lastHeight;
    const resize = ({ width, height }) => {
      if (width === lastWidth && height === lastHeight) return;
      // Explicit dimensions keep SVG percentages from retaining a stale viewport
      // when asynchronous content changes the containing Card's height.
      const surface = svg.parentElement;
      const outer = getComputedStyle(surface);
      const inset = getComputedStyle(svg);
      const padding = parseFloat(inset.left) || parseFloat(inset.marginLeft) || 0;
      const radius = Math.max(0, (parseFloat(outer.borderTopLeftRadius) || 0) - padding - 2);
      const path = squirclePath(Math.max(0, width - 2), Math.max(0, height - 2), radius);
      return () => {
        if (width !== lastWidth) svg.style.setProperty('--stitch-path-width', `${Math.max(0, width - 2)}px`);
        if (height !== lastHeight) svg.style.setProperty('--stitch-path-height', `${Math.max(0, height - 2)}px`);
        svg.querySelectorAll('path').forEach((node) => {
          if (node.getAttribute('d') !== path) node.setAttribute('d', path);
        });
        lastWidth = width;
        lastHeight = height;
        svg.dataset.stitchReady = 'true';
      };
    };
    let observed = false;
    let stopSize = () => {};
    const stopProximity = observeProximity(svg, (near) => {
      if (near && !observed) {
        observed = true;
        stopSize = observeSize(svg, resize);
      } else if (!near && observed) {
        observed = false;
        stopSize();
      }
    });
    return () => {
      stopProximity();
      stopSize();
    };
  }, []);
  return (
    <svg ref={ref} className="ds-stitch" data-stitch-ready="false" aria-hidden="true" focusable="false">
      {contrast && <path className="ds-stitch-underlay" />}
      <path />
      {contrast && <rect className="ds-stitch-underlay" x="1" y="1" />}
      <rect x="1" y="1" />
    </svg>
  );
}
