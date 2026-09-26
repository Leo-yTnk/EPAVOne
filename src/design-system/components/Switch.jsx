export function Switch({ children, ...props }) {
  return <label className="ds-switch"><input type="checkbox" {...props}/><span className="ds-switch-track"><span className="ds-switch-thumb"></span></span><span>{children}</span></label>;
}
