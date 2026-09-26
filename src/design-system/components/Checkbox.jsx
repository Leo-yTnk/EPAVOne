export function Checkbox({ children, ...props }) {
  return <label className="ds-checkbox"><input type="checkbox" {...props}/><span className="ds-checkbox-control" aria-hidden="true">✓</span><span>{children}</span></label>;
}
