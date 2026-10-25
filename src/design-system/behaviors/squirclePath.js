// Quarter superellipses (n=4), joined by straight edges. Coordinates use the
// actual SVG size, so dashes retain their length when the card grows.
const quarter = Array.from({ length: 24 }, (_, index) => {
  const angle = (((index + 1) / 24) * Math.PI) / 2;
  return [Math.sqrt(Math.sin(angle)), Math.sqrt(Math.cos(angle))];
});
const paths = new Map();
export function squirclePath(width, height, radius) {
  const w = Math.max(0, width),
    h = Math.max(0, height);
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  if (!w || !h) return '';
  const key = `${w}:${h}:${r}`;
  if (paths.has(key)) return paths.get(key);
  const point = (x, y) => `${(x + 1).toFixed(3)} ${(y + 1).toFixed(3)}`;
  let d = `M ${point(r, 0)} L ${point(w - r, 0)}`;
  const corners = [
    [w - r, r, -1, 1],
    [w - r, h - r, 1, 1],
    [r, h - r, 1, -1],
    [r, r, -1, -1]
  ];
  corners.forEach(([cx, cy, start, direction], corner) => {
    for (const [sin, cos] of quarter) {
      const a = r * sin;
      const b = r * cos;
      const x = corner % 2 === 0 ? cx + direction * a : cx + direction * b;
      const y = corner % 2 === 0 ? cy + start * b : cy + start * a;
      d += ` L ${point(x, y)}`;
    }
    if (corner === 0) d += ` L ${point(w, h - r)}`;
    if (corner === 1) d += ` L ${point(r, h)}`;
    if (corner === 2) d += ` L ${point(0, r)}`;
  });
  const result = d + ' Z';
  if (paths.size >= 256) paths.delete(paths.keys().next().value);
  paths.set(key, result);
  return result;
}
