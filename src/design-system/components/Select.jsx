import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { cx } from '../../shared/utils/cx.js';

export function NativeSelect({ label, helper, id, children, className='', ...props }) {
  return <label className="ds-field" htmlFor={id}><span className="ds-input-label">{label}</span><select id={id} className={cx('ds-select', className)} {...props}>{children}</select>{helper && <span className="ds-input-helper">{helper}</span>}</label>;
}

export function Select({ label, options, value, onChange, disabled=false, helper }) {
  const autoId = useId();
  const labelId = autoId + '-label';
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find(option => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const close = event => {
      if (!menuRef.current?.parentElement?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  function choose(option) {
    if (option.disabled) return;
    onChange?.(option.value);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function onKeyDown(event) {
    if (!open && ['ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    const enabled = options.filter(option => !option.disabled);
    const index = Math.max(0, enabled.findIndex(option => option.value === value));
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      choose(enabled[(index + delta + enabled.length) % enabled.length]);
    }
  }

  return <div className="ds-field ds-selectbox" onKeyDown={onKeyDown}>
    <span className="ds-input-label" id={labelId}>{label}</span>
    <button ref={triggerRef} className="ds-select-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={labelId} disabled={disabled} onClick={() => setOpen(current => !current)}><span>{selected?.label}</span><span aria-hidden="true">⌄</span></button>
    {open && <div ref={menuRef} className="ds-select-menu" role="listbox" aria-labelledby={labelId}>{options.map(option => <button key={option.value} className="ds-option" role="option" aria-selected={option.value === value} aria-disabled={option.disabled || undefined} disabled={option.disabled} onClick={() => choose(option)}>{option.label}</button>)}</div>}
    {helper && <span className="ds-input-helper">{helper}</span>}
  </div>;
}
