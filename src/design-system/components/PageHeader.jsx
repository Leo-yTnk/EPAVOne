import { AppLogo } from './AppLogo.jsx';
import { Card } from './Card.jsx';
import { cx } from '../../shared/utils/cx.js';

// One page hierarchy across apps. Product identity changes color, never geometry.
export function PageHeader({ product, eyebrow, title, description, actions, children, className = '' }) {
  const identity = eyebrow || (product && <AppLogo product={product} size="sm" wordmark />);
  return (
    <Card as="header" padding="compact" className={cx('ds-page-header', className)}>
      <div className="ds-page-header-main">
        <div className="ds-page-header-copy">
          {identity && <div className={typeof identity === 'string' ? 'ds-overline' : 'ds-page-header-brand'}>{identity}</div>}
          <h1 className="ds-page-title">{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="ds-page-header-actions">{actions}</div>}
      </div>
      {children && <div className="ds-page-header-content">{children}</div>}
    </Card>
  );
}
