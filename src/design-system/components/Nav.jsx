import { cx } from '../../shared/utils/cx.js';

export function Nav({ items, label='Navegação', className='' }) {
  return <nav className={cx('ds-nav', className)} aria-label={label}>{items.map(item => <a key={item.href} className={cx('ds-nav-item', item.active && 'is-active')} href={item.href} aria-current={item.active ? 'page' : undefined}>{item.label}</a>)}</nav>;
}
