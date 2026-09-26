export function DateRange({ label, start, end, onStartChange, onEndChange }) {
  const control=<div className="ds-date-range">
    <input className="ds-input" type="date" value={start} aria-label={label?label+' inicial':'Data inicial'} onInput={event=>onStartChange?.(event.currentTarget.value)}/>
    <span className="ds-date-range-separator">até</span>
    <input className="ds-input" type="date" value={end} aria-label={label?label+' final':'Data final'} onInput={event=>onEndChange?.(event.currentTarget.value)}/>
  </div>;

  if(!label) return control;
  return <div className="ds-field"><span className="ds-input-label">{label}</span>{control}</div>;
}
