import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { observeVisibility } from '../behaviors/observeVisibility.js';
import { observeSize } from '../behaviors/observeSize.js';

// Keep an inexpensive slot for native scrolling; mount expensive card contents
// only near the viewport. Never remove the keyboard's current focus.
export function DeferredItem({ label, margin = 600, children }) {
  const ref = useRef(null);
  const focusPending = useRef(false);
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const active = visible || focused;
  useLayoutEffect(() => observeVisibility(ref.current, margin, setVisible), [margin]);
  useLayoutEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (focusPending.current) {
      focusPending.current = false;
      node.querySelector('button, a[href], input, [tabindex="0"]')?.focus({ preventScroll: true });
    }
    return observeSize(node, ({ height }) => () => {
      if (height > 0) node.style.setProperty('--deferred-item-height', `${height}px`);
    });
  }, [active]);
  return (
    <div
      ref={ref}
      className="ds-deferred-item"
      data-active={active}
      role="group"
      aria-label={active ? label : `Mostrar ${label}`}
      tabIndex={active ? undefined : 0}
      onFocusCapture={() => {
        if (!active) focusPending.current = true;
        setFocused(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      {active ? children() : <div className="ds-deferred-placeholder" aria-hidden="true" />}
    </div>
  );
}
