import { cx } from '../../shared/utils/cx.js';

export function SummaryList({ items, layout = 'grid', emphasis = false, className = '' }) {
  return (
    <dl className={cx('ds-summary-list', emphasis && 'is-emphasized', className)} data-layout={layout}>
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
