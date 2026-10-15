import { useControlId } from '../behaviors/useControlId.js';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useAnchoredLayer } from '../behaviors/useAnchoredLayer.js';
import { Button } from './Button.jsx';
import { Portal } from './Portal.jsx';
import { Icon } from './Icon.jsx';

export function Menu({ label, triggerLabel = label, items, variant = 'ghost', size = 'sm', contextRequest, contextOnly = false }) {
  const id = useControlId();
  const triggerRef = useRef(null);
  const layerRef = useRef(null);
  const itemRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const pointRef = useMemo(
    () => ({
      current: contextRequest
        ? {
            getBoundingClientRect: () => ({
              left: contextRequest.x,
              right: contextRequest.x,
              top: contextRequest.y,
              bottom: contextRequest.y,
              width: 0,
              height: 0
            })
          }
        : null
    }),
    [contextRequest]
  );
  const [contextual, setContextual] = useState(false);
  const position = useAnchoredLayer(contextual ? pointRef : triggerRef, layerRef, open, { offset: 7, minWidth: 180 });
  const enabledIndexes = items.map((item, index) => (item.disabled ? null : index)).filter((index) => index !== null);

  useLayoutEffect(() => {
    if (contextRequest) {
      setContextual(true);
      setOpen(true);
    }
  }, [contextRequest]);

  useLayoutEffect(() => {
    if (!open) return;
    const first = enabledIndexes[0] ?? 0;
    setHighlighted(first);
    itemRefs.current[first]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function closeOnPointer(event) {
      if (triggerRef.current?.contains(event.target) || layerRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    const dismiss = () => setOpen(false);
    document.addEventListener('pointerdown', closeOnPointer, true);
    window.addEventListener('hashchange', dismiss);
    return () => {
      document.removeEventListener('pointerdown', closeOnPointer, true);
      window.removeEventListener('hashchange', dismiss);
    };
  }, [open]);

  function close({ focusTrigger = true } = {}) {
    setOpen(false);
    if (focusTrigger)
      requestAnimationFrame(() => (contextual ? contextRequest?.returnFocus : triggerRef.current)?.focus({ preventScroll: true }));
  }

  function move(direction) {
    const currentIndex = enabledIndexes.indexOf(highlighted);
    const next = enabledIndexes[(Math.max(0, currentIndex) + direction + enabledIndexes.length) % enabledIndexes.length];
    if (next === undefined) return;
    setHighlighted(next);
    itemRefs.current[next]?.focus();
  }

  function onMenuKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      const next = enabledIndexes[0];
      setHighlighted(next);
      itemRefs.current[next]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      const next = enabledIndexes.at(-1);
      setHighlighted(next);
      itemRefs.current[next]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      close();
    }
  }

  return (
    <>
      {!contextOnly && (
        <Button
          ref={triggerRef}
          variant={variant}
          size={size}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? id : undefined}
          onClick={() => {
            setContextual(false);
            setOpen((current) => !current);
          }}
        >
          {triggerLabel}
        </Button>
      )}
      {open && (
        <Portal>
          <div
            ref={layerRef}
            id={id}
            className="ds-layer-anchor ds-menu-layer"
            data-kind="menu"
            data-side={position?.side ?? 'bottom'}
            data-positioned={position ? 'true' : 'false'}
            style={position?.style}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
          >
            <div className="ds-layer-scroll">
              {items.map((item, index) => {
                const content = (
                  <>
                    {item.icon && <Icon name={item.icon} />}
                    <span className="ds-menu-item-label">{item.label}</span>
                  </>
                );
                const common = {
                  ref: (node) => {
                    itemRefs.current[index] = node;
                  },
                  className: 'ds-menu-item' + (index === highlighted ? ' is-highlighted' : ''),
                  role: 'menuitem',
                  tabIndex: index === highlighted ? 0 : -1,
                  'aria-disabled': item.disabled || undefined,
                  onFocus: () => setHighlighted(index),
                  onPointerMove: () => !item.disabled && setHighlighted(index),
                  onClick: () => {
                    if (item.disabled) return;
                    item.onSelect?.();
                    close({ focusTrigger: contextOnly && !item.href });
                  }
                };
                const action = item.href ? (
                  <a key={item.label} {...common} href={item.disabled ? undefined : item.href}>
                    {content}
                  </a>
                ) : (
                  <button key={item.label} {...common} type="button" disabled={item.disabled}>
                    {content}
                  </button>
                );
                return (
                  <div key={item.label} role="none">
                    {item.group && item.group !== items[index - 1]?.group && (
                      <div className="ds-menu-group" role="presentation">
                        {item.group}
                      </div>
                    )}
                    {action}
                  </div>
                );
              })}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
