import { cx } from '../../shared/utils/cx.js';

export function Tabs({ items, value, onChange, label = 'Abas', className = '', id, orientation = 'horizontal' }) {
  function onKeyDown(event) {
    const enabled = items.filter((item) => !item.disabled);
    if (!enabled.length) return;
    const index = Math.max(
      0,
      enabled.findIndex((item) => item.value === value)
    );
    const forward = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const backward = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    if (![forward, backward, 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? enabled[0]
        : event.key === 'End'
          ? enabled.at(-1)
          : enabled[(index + (event.key === forward ? 1 : -1) + enabled.length) % enabled.length];
    onChange?.(next.value);
    event.currentTarget.querySelectorAll('[role="tab"]')[items.indexOf(next)]?.focus();
  }
  return (
    <div
      id={id}
      className={cx('ds-tabs', className)}
      role="tablist"
      aria-orientation={orientation}
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => (
        <button
          key={item.value}
          id={item.id}
          aria-controls={item.panelId}
          tabIndex={item.value === value ? 0 : -1}
          className={cx('ds-tab', item.value === value && 'is-active')}
          role="tab"
          aria-selected={item.value === value}
          disabled={item.disabled}
          onClick={() => onChange?.(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
