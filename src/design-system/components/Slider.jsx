export function Slider({ label, value, onInput, min=0, max=100, disabled=false, suffix='%', ...props }) {
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return <label className="ds-slider-field"><span className="ds-slider-head"><span className="ds-input-label">{label}</span><output className="ds-slider-value">{value}{suffix}</output></span><input className="ds-slider" type="range" min={min} max={max} value={value} disabled={disabled} style={{'--slider-progress': progress + '%'}} onInput={event => onInput?.(Number(event.currentTarget.value))} {...props}/></label>;
}
