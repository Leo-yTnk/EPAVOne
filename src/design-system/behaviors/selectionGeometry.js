// Use layout dimensions rather than the transient scale from press feedback.
export function selectionGeometry(container, selected) {
  const outer = container.getBoundingClientRect();
  const inner = selected.getBoundingClientRect();
  const style = getComputedStyle(selected);
  const width = parseFloat(style.width) || inner.width;
  const height = parseFloat(style.height) || inner.height;
  const positionedHere = selected.offsetParent === container;
  return {
    x: positionedHere
      ? selected.offsetLeft
      : inner.left + (inner.width - width) / 2 - outer.left + container.scrollLeft - container.clientLeft,
    y: positionedHere
      ? selected.offsetTop
      : inner.top + (inner.height - height) / 2 - outer.top + container.scrollTop - container.clientTop,
    width,
    height
  };
}
