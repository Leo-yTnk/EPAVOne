import { useControlId } from '../behaviors/useControlId.js';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useAnchoredLayer } from '../behaviors/useAnchoredLayer.js';
import { Option } from './Option.jsx';
import { Portal } from './Portal.jsx';
import { Input } from './Input.jsx';

export function Select({ label, options: allOptions, value, onChange, disabled = false, helper, searchable = false }) {
  const autoId = useControlId();
  const labelId = autoId + '-label';
  const valueId = autoId + '-value';
  const menuId = autoId + '-menu';
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [query, setQuery] = useState('');
  const fold = (text) =>
    String(text)
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  const options = searchable && query ? allOptions.filter((option) => fold(option.label).includes(fold(query))) : allOptions;
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const selected = allOptions.find((option) => option.value === value) || allOptions[0];
  const position = useAnchoredLayer(triggerRef, menuRef, open, { offset: 7, minWidth: 180, matchWidth: true });

  const enabledIndexes = options.map((option, index) => (option.disabled ? null : index)).filter((index) => index !== null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    if (searchable) menuRef.current?.querySelector('input')?.focus();
  }, [open, searchable]);
  useEffect(() => {
    setHighlighted(enabledIndexes[0] ?? 0);
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    setHighlighted(options[selectedIndex]?.disabled ? (enabledIndexes[0] ?? 0) : selectedIndex);

    function closeOnPointer(event) {
      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener('pointerdown', closeOnPointer);
    return () => document.removeEventListener('pointerdown', closeOnPointer);
  }, [open, selectedIndex]);

  function choose(index) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange?.(option.value);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function moveHighlight(direction) {
    const current = Math.max(0, enabledIndexes.indexOf(highlighted));
    const next = enabledIndexes[(current + direction + enabledIndexes.length) % enabledIndexes.length];
    if (next !== undefined) setHighlighted(next);
  }

  function onKeyDown(event) {
    const isSearch = event.target.type === 'search';
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
        if (event.key === 'ArrowUp') setHighlighted(enabledIndexes.at(-1) ?? selectedIndex);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveHighlight(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(-1);
    } else if (event.key === 'Home' && !isSearch) {
      event.preventDefault();
      setHighlighted(enabledIndexes[0] ?? 0);
    } else if (event.key === 'End' && !isSearch) {
      event.preventDefault();
      setHighlighted(enabledIndexes.at(-1) ?? 0);
    } else if (event.key === 'Enter' || (event.key === ' ' && !isSearch)) {
      event.preventDefault();
      choose(highlighted);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div className="ds-field ds-selectbox">
      <span className="ds-input-label" id={labelId}>
        {label}
      </span>
      <button
        ref={triggerRef}
        className="ds-select-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-activedescendant={open ? autoId + '-option-' + highlighted : undefined}
        aria-labelledby={labelId + ' ' + valueId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
      >
        <span id={valueId}>{selected?.label}</span>
        <span className="ds-select-trigger-icon" aria-hidden="true">
          ⌄
        </span>
      </button>
      {helper && <span className="ds-input-helper">{helper}</span>}
      {open && (
        <Portal>
          <div
            ref={menuRef}
            className="ds-layer-anchor ds-select-menu"
            data-kind="select"
            data-side={position?.side ?? 'bottom'}
            data-positioned={position ? 'true' : 'false'}
            style={position?.style}
            onKeyDown={onKeyDown}
          >
            {searchable && (
              <Input
                id={autoId + '-search'}
                label={'Buscar ' + label.replace(/ ·.*/, '').toLowerCase()}
                type="search"
                role="combobox"
                aria-expanded="true"
                aria-controls={menuId}
                aria-autocomplete="list"
                aria-activedescendant={options[highlighted] ? autoId + '-option-' + highlighted : undefined}
                value={query}
                onInput={(event) => setQuery(event.currentTarget.value)}
              />
            )}
            <div id={menuId} className="ds-layer-scroll" role="listbox" aria-labelledby={labelId}>
              {options.map((option, index) => (
                <Option
                  key={option.value}
                  id={autoId + '-option-' + index}
                  selected={option.value === value}
                  highlighted={index === highlighted}
                  disabled={option.disabled}
                  onPointerMove={() => !option.disabled && setHighlighted(index)}
                  onClick={() => choose(index)}
                >
                  {option.label}
                </Option>
              ))}
            </div>
            {!options.length && (
              <p role="status" className="ds-input-helper">
                Nenhuma opção encontrada.
              </p>
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}
