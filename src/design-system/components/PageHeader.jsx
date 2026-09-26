export function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="ds-page-header"><div className="ds-page-header-copy">{eyebrow && <span className="ds-overline">{eyebrow}</span>}<h1 className="ds-heading-h2">{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="ds-inline">{actions}</div>}</header>;
}
