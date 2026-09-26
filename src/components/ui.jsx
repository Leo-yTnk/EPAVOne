export function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    spark: <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4Z"/>
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Button({ children, variant = 'primary', icon, className = '', ...props }) {
  return <button className={`button button--${variant} ${className}`} {...props}><span>{children}</span>{icon && <Icon name={icon} />}</button>;
}

export function Card({ children, className = '', interactive = false, ...props }) {
  return <article className={`card ${interactive ? 'card--interactive' : ''} ${className}`} {...props}>{children}</article>;
}

export function Badge({ children, tone = 'brand' }) { return <span className={`badge badge--${tone}`}><i />{children}</span>; }

export function Select({ label, options, ...props }) {
  return <label className="field"><span>{label}</span><span className="select-wrap"><select {...props}>{options.map(option => <option key={option}>{option}</option>)}</select><span aria-hidden="true">⌄</span></span></label>;
}

export function Slider({ label, value, onChange, min = 0, max = 100 }) {
  return <label className="field"><span className="field-line"><span>{label}</span><output>{value}%</output></span><input type="range" min={min} max={max} value={value} onChange={onChange} /></label>;
}

export function Progress({ value, label }) {
  return <div className="progress"><span className="field-line"><span>{label}</span><strong>{value}%</strong></span><div className="progress-track"><i style={{ width: `${value}%` }} /></div></div>;
}
