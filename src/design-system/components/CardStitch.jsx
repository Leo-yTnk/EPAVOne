import { useLayoutEffect, useRef } from 'preact/hooks';
import { observeSize } from '../behaviors/observeSize.js';

export function CardStitch({ contrast = false }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    let lastWidth, lastHeight;
    return observeSize(svg, ({ width, height }) => {
      // Explicit dimensions keep SVG percentages from retaining a stale viewport
      // when asynchronous content changes the containing Card's height.
      if (width !== lastWidth) svg.style.setProperty('--stitch-path-width', `${Math.max(0, width - 2)}px`);
      if (height !== lastHeight) svg.style.setProperty('--stitch-path-height', `${Math.max(0, height - 2)}px`);
      lastWidth = width;
      lastHeight = height;
    });
  }, []);
  return (
    <svg ref={ref} className="ds-stitch" aria-hidden="true" focusable="false">
      {contrast && <rect className="ds-stitch-underlay" x="1" y="1" />}
      <rect x="1" y="1" />
    </svg>
  );
}
