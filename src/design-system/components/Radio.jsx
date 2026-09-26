export function Radio({ children, ...props }) {
  return <label className="ds-radio"><input type="radio" {...props}/><span className="ds-radio-control" aria-hidden="true"></span><span>{children}</span></label>;
}
