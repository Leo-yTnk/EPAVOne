import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Menu } from './Menu.jsx';

// Preserve native editing, link/image actions, selection and existing controls.
const nativeTarget =
  'a, button, input, textarea, select, label, summary, img, video, [contenteditable]:not([contenteditable="false"]), [role="menu"], [role="slider"]';
export function ContextMenu({ children, items, label = 'Atalhos desta página', className = '', ...props }) {
  const [request, setRequest] = useState(null);
  const gesture = useRef(null);
  const held = useRef(false);
  const cancel = useCallback(() => {
    if (gesture.current) clearTimeout(gesture.current.timer);
    gesture.current = null;
    window.removeEventListener('scroll', cancel, true);
  }, []);
  useEffect(() => cancel, []);
  const eligible = (event) => !event.defaultPrevented && !event.target.closest(nativeTarget) && !window.getSelection?.()?.toString();
  return (
    <div
      {...props}
      className={className}
      tabIndex={props.tabIndex ?? 0}
      role={props.role ?? 'group'}
      aria-label={label}
      onKeyDown={(event) => {
        if (!eligible(event) || !(event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) return;
        event.preventDefault();
        event.stopPropagation();
        cancel();
        const rect = event.currentTarget.getBoundingClientRect();
        setRequest({ x: rect.left + 12, y: Math.max(12, rect.top + 12), returnFocus: event.currentTarget });
      }}
      onContextMenu={(event) => {
        if (!eligible(event)) return;
        event.preventDefault();
        event.stopPropagation();
        cancel();
        setRequest({ x: event.clientX, y: event.clientY, returnFocus: event.currentTarget });
      }}
      onPointerDown={(event) => {
        cancel();
        held.current = false;
        if (!eligible(event) || !['touch', 'pen'].includes(event.pointerType) || event.isPrimary === false) return;
        const { clientX: x, clientY: y, currentTarget: returnFocus } = event;
        gesture.current = {
          x,
          y,
          timer: setTimeout(() => {
            if (window.getSelection?.()?.toString()) return cancel();
            held.current = true;
            setRequest({ x, y, returnFocus });
            cancel();
          }, 550)
        };
        window.addEventListener('scroll', cancel, true);
        event.stopPropagation();
      }}
      onPointerMove={(event) => {
        const start = gesture.current;
        if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) cancel();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onClickCapture={(event) => {
        if (!held.current || event.target.closest('[role="menu"]')) return;
        held.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <Menu label={label} items={items} contextRequest={request} contextOnly />
      {children}
    </div>
  );
}
