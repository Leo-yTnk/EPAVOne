const GAP = 12;

export function anchoredPosition(rect, layer, viewport, { offset = 8, minWidth = 0, matchWidth = false, placement = 'auto' } = {}) {
  const leftEdge = viewport.left + GAP;
  const rightEdge = viewport.left + viewport.width - GAP;
  const topEdge = viewport.top + GAP;
  const bottomEdge = viewport.top + viewport.height - GAP;
  const width = Math.max(0, Math.min(Math.max(matchWidth ? rect.width : layer.width, minWidth), viewport.width - 2 * GAP));
  const clampY = (value) => Math.min(Math.max(topEdge, value), Math.max(topEdge, bottomEdge));
  const belowTop = clampY(rect.bottom + offset);
  const aboveBottom = clampY(rect.top - offset);
  const below = Math.max(0, bottomEdge - belowTop);
  const above = Math.max(0, aboveBottom - topEdge);
  const side =
    placement === 'top'
      ? 'top'
      : placement === 'bottom'
        ? 'bottom'
        : below >= Math.min(180, layer.height) || below >= above
          ? 'bottom'
          : 'top';
  const center = rect.left + rect.width / 2;
  const left = Math.min(Math.max(leftEdge, center - width / 2), Math.max(leftEdge, rightEdge - width));
  return {
    side,
    style: {
      '--layer-left': left + 'px',
      '--layer-width': width + 'px',
      '--layer-origin-x': Math.min(Math.max(0, center - left), width) + 'px',
      '--layer-max-height': Math.min(288, side === 'bottom' ? below : above) + 'px',
      ...(side === 'bottom' ? { '--layer-top': belowTop + 'px' } : { '--layer-bottom': viewport.layoutHeight - aboveBottom + 'px' })
    }
  };
}
