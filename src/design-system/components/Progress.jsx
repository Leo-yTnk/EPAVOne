export function Progress({ label, value, max=100, formatValue }) {
  const safeMax=max>0?max:100;
  const safeValue=Math.min(Math.max(0,value),safeMax);
  const percent=(safeValue/safeMax)*100;
  const display=formatValue ? formatValue(safeValue,safeMax) : Math.round(percent)+'%';

  return <div className="ds-progress">
    <div className="ds-progress-head"><span>{label}</span><strong>{display}</strong></div>
    <div className="ds-progress-track" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax={safeMax} aria-valuenow={safeValue}>
      <div className="ds-progress-fill" style={{'--progress':percent+'%'}}/>
    </div>
  </div>;
}
