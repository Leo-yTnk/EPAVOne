import { Nav } from './Nav.jsx';
export function Sidebar({ items, label='Navegação lateral' }) { return <aside className="ds-sidebar"><Nav items={items} label={label}/></aside>; }
