import { PRODUCT_META } from './routes.js';
import { Button } from '../design-system/components/Button.jsx';

export function AppShell({ route, theme, onToggleTheme, children }) {
  const selectedProduct = route.product === 'dev' ? 'home' : route.product;
  return <div className="app-shell">
    <a className="skip-link" href="#main">Ir para o conteúdo</a>
    <header className="site-header">
      <a className="brand navigation-island" href="#/" aria-label="EPAVOne, página inicial"><span className="brand-mark">e.</span><span>EPAV<span className="brand-one">One</span></span></a>
      <nav className="product-tabs navigation-island" aria-label="Produtos EPAV">
        {Object.entries(PRODUCT_META).map(([key,item]) => <a key={key} className={'product-tab ' + (selectedProduct===key?'is-active':'')} href={item.href} aria-current={selectedProduct===key?'page':undefined}>{item.label}</a>)}
      </nav>
      <div className="header-actions navigation-island">
        <Button variant="ghost" size="sm" onClick={onToggleTheme}>{theme==='dark'?'☀ Claro':'◐ Escuro'}</Button>
        <Button variant="ghost" size="sm">Conta</Button>
      </div>
    </header>
    <main id="main" className="app-main">{children}</main>
    <footer className="site-footer"><span>EPAVOne · Experiências Práticas em Atividades de Varejo</span><span>Planeje. Entenda. Prepare.</span></footer>
  </div>;
}
