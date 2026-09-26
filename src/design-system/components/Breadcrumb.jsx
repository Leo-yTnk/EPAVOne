export function Breadcrumb({ items }) {
  return <nav className="ds-breadcrumb" aria-label="Breadcrumb">{items.map((item,index) => <span key={item.label} className="ds-breadcrumb-item">{index > 0 && <span aria-hidden="true">/</span>}{item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</span>)}</nav>;
}
