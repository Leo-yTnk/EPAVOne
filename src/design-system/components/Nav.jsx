import { cx } from '../../shared/utils/cx.js';
import { NavItem } from './NavItem.jsx';

export function Nav({ items, label='Navegação', className='' }) {
  return <nav className={cx('ds-nav',className)} aria-label={label}>{items.map(item => <NavItem key={item.href} href={item.href} active={item.active}>{item.label}</NavItem>)}</nav>;
}
