export function Divider({ className = '', ...props }) {
  return <hr {...props} className={`ds-divider ${className}`} />;
}
