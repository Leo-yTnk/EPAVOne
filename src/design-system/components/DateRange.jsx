export function DateRange({ start, end, onStartChange, onEndChange }) {
  return <div className="ds-date-range"><input className="ds-input" type="date" value={start} aria-label="Data inicial" onInput={event => onStartChange?.(event.currentTarget.value)}/><span className="ds-date-range-separator">até</span><input className="ds-input" type="date" value={end} aria-label="Data final" onInput={event => onEndChange?.(event.currentTarget.value)}/></div>;
}
