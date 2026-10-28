import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { observeSize } from '../behaviors/observeSize.js';

// Preserve native horizontal scrolling while bounding the mounted card count.
export function WindowedItems({ trackRef, items, renderItem, overscan = 2 }) {
  const [range, setRange] = useState({ start: 0, end: 6 });
  const [focused, setFocused] = useState(null);
  const [target, setTarget] = useState(null);
  const pitch = useRef(240);
  useLayoutEffect(() => {
    const track = trackRef.current;
    let frame;
    const measure = () => {
      const style = getComputedStyle(track);
      pitch.current = (parseFloat(style.gridAutoColumns) || 240) + (parseFloat(style.columnGap) || 0);
      const start = Math.max(0, Math.floor(track.scrollLeft / pitch.current) - overscan);
      const end = Math.min(items.length, Math.ceil((track.scrollLeft + track.clientWidth) / pitch.current) + overscan);
      setRange((old) => (old.start === start && old.end === end ? old : { start, end }));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    track.addEventListener('scroll', schedule, { passive: true });
    const stop = observeSize(track, schedule);
    return () => {
      stop();
      cancelAnimationFrame(frame);
      track.removeEventListener('scroll', schedule);
    };
  }, [trackRef, items, overscan]);
  useLayoutEffect(() => {
    if (target === null) return;
    const node = trackRef.current.querySelector(`[data-windowed-index="${target}"]`);
    if (!node) return;
    node.querySelector('button, a[href], [tabindex="0"]')?.focus();
    setTarget(null);
  }, [target, range, trackRef]);
  const indexes = Array.from({ length: Math.max(0, Math.min(items.length, range.end) - range.start) }, (_, i) => range.start + i);
  if (focused !== null && focused < items.length && !indexes.includes(focused)) indexes.push(focused);
  if (target !== null && target < items.length && !indexes.includes(target)) indexes.push(target);
  indexes.sort((a, b) => a - b);
  const jump = (index) => {
    setTarget(index);
    trackRef.current.scrollLeft = index * pitch.current;
  };
  const output = [];
  let cursor = 0;
  for (const index of indexes) {
    if (index > cursor)
      output.push(
        <div
          key={`gap-${cursor}`}
          className="ds-windowed-spacer"
          style={{ '--virtual-columns': index - cursor }}
          role="group"
          tabIndex={0}
          aria-label="Mostrar itens anteriores"
          onFocus={() => jump(index - 1)}
        />
      );
    output.push(
      <div
        key={items[index].id}
        className="ds-windowed-item"
        data-windowed-index={index}
        onFocusCapture={() => setFocused(index)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
        }}
      >
        {renderItem(items[index])}
      </div>
    );
    cursor = index + 1;
  }
  if (cursor < items.length)
    output.push(
      <div
        key="remaining"
        className="ds-windowed-spacer"
        style={{ '--virtual-columns': items.length - cursor }}
        role="group"
        tabIndex={0}
        aria-label="Mostrar próximos itens"
        onFocus={() => jump(cursor)}
      />
    );
  return output;
}
