import { cx } from '../../shared/utils/cx.js';

export function Tabs({ items, value, onChange, label='Abas' }) {
  function onKeyDown(event) {
    const enabled = items.filter(item => !item.disabled);
    const index = Math.max(0, enabled.findIndex(item => item.value === value));
    if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled.at(-1) : enabled[(index + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length];
    onChange?.(next.value);
  }
  return <div className="ds-tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>{items.map(item => <button key={item.value} className={cx('ds-tab', item.value === value && 'is-active')} role="tab" aria-selected={item.value === value} disabled={item.disabled} onClick={() => onChange?.(item.value)}>{item.label}</button>)}</div>;
}
