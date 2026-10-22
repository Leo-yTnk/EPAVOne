export function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="ds-page-header"><div className="ds-page-header-copy">{eyebrow && <div className={typeof eyebrow === 'string' ? 'ds-overline' : 'ds-page-header-brand'}>{eyebrow}</div>}<h1 className="ds-heading-h2">{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="ds-inline">{actions}</div>}</header>;
}
