import { useRef } from 'preact/hooks';
import { PRODUCT_META } from './routes.js';
import { Button, Menu, SelectionIndicator } from '../design-system/components/index.js';

const accountItems = [
  { label: 'Perfil do Insights', href: '#/insights/perfil' },
  { label: 'Component Lab', href: '#/dev/components' }
];

export function AppShell({ route, theme, onToggleTheme, children }) {
  const tabsRef = useRef(null);
  const selectedProduct = route.product === 'dev' ? 'home' : route.product;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      <header className="site-header">
        <a className="brand navigation-island" href="#/" aria-label="EPAVOne, página inicial">
          <span className="brand-mark">e.</span>
          <span>
            EPAV<span className="brand-one">One</span>
          </span>
        </a>
        <nav ref={tabsRef} className="product-tabs navigation-island" aria-label="Produtos EPAV">
          <SelectionIndicator containerRef={tabsRef} value={selectedProduct} />
          {Object.entries(PRODUCT_META).map(([key, item]) => (
            <a
              key={key}
              className={'product-tab ' + (selectedProduct === key ? 'is-active' : '')}
              href={item.href}
              aria-current={selectedProduct === key ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-actions navigation-island">
          <Button variant="ghost" size="sm" onClick={onToggleTheme}>
            {theme === 'dark' ? '☀ Claro' : '◐ Escuro'}
          </Button>
          <Menu label="Conta" items={accountItems} />
        </div>
      </header>
      <main id="main" className="app-main" tabIndex="-1">
        {children}
      </main>
      <footer className="site-footer">
        <span>EPAVOne · Experiências Práticas em Atividades de Varejo</span>
        <span>Planeje. Entenda. Prepare.</span>
      </footer>
    </div>
  );
}
