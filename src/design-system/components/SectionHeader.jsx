import { cx } from '../../shared/utils/cx.js';

export function SectionHeader({ title, description, eyebrow, actions, size = 'md', as: Tag = 'h2', id, className = '' }) {
  return (
    <header className={cx('ds-section-header', size === 'sm' && 'ds-section-header-sm', className)}>
      <div className="ds-section-header-copy">
        {eyebrow && <span className="ds-overline">{eyebrow}</span>}
        <Tag id={id} className="ds-section-title">
          {title}
        </Tag>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="ds-section-header-actions">{actions}</div>}
    </header>
  );
}
