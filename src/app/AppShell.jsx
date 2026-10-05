import { useEffect, useRef } from 'preact/hooks';
import { INSIGHTS_NAV, PRODUCT_META, routeHash } from './routes.js';
import { Button, Menu, NavItem, SelectionIndicator, Tabs, Icon } from '../design-system/components/index.js';
import { YOURCIPE_URL } from '../shared/config/catalog.js';

const resourceItems = [
  { label: 'Conta e recursos do Yourcipe ↗', href: YOURCIPE_URL },
  { label: 'Component Lab', href: '#/dev/components' }
];

export function AppShell({ route, theme, onToggleTheme, account, onOpenAccount, children }) {
  const tabsRef = useRef(null);
  const insightsRef = useRef(null);
  const lastRoutes = useRef({});
  const insightsSection = route.segments[0] === 'home' ? '' : route.segments[0] || '';
  const selectedProduct = route.product === 'dev' ? 'home' : route.product;
  useEffect(() => {
    if (route.product !== 'dev') lastRoutes.current[route.product] = routeHash(route.product, route.segments);
    tabsRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [route]);

  function selectApp(product) {
    window.location.hash = lastRoutes.current[product] || PRODUCT_META[product].href;
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      <header className="site-header">
        <div className="header-toolbar">
          <a className="brand" href="#/" aria-label="EPAVOne, página inicial">
            <span className="brand-mark">e.</span>
            <span>
              EPAV<span className="brand-one">One</span>
            </span>
          </a>
          <span className="workspace-label">Seu espaço de trabalho</span>
          <div className="header-actions">
            <Button
              variant="ghost"
              size="sm"
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              onClick={onToggleTheme}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
              <span className="theme-label"> {theme === 'dark' ? 'Claro' : 'Escuro'}</span>
            </Button>
            <Menu
              label={account?.session ? 'Minha conta' : 'Conta'}
              items={[{ label: account?.session ? 'Minha conta' : 'Entrar', onSelect: onOpenAccount }, ...resourceItems]}
            />
          </div>
        </div>
        <div ref={tabsRef} className="workspace-apps">
          <Tabs
            label="Apps do EPAVOne"
            className="app-tabs"
            value={selectedProduct}
            onChange={selectApp}
            items={Object.entries(PRODUCT_META).map(([key, item]) => ({
              value: key,
              id: `app-tab-${key}`,
              panelId: 'workspace-panel',
              label: (
                <span className="app-tab-label" data-product={item.product}>
                  <span className="app-tab-glyph" aria-hidden="true">
                    <Icon name={key} />
                  </span>
                  {item.label}
                </span>
              )
            }))}
          />
        </div>
        <div className="workspace-context">
          <span className="workspace-context-name">
            {route.product === 'dev' ? 'Component Lab' : `EPAV${PRODUCT_META[selectedProduct].label}`}
          </span>
          {selectedProduct === 'insights' ? (
            <nav ref={insightsRef} className="insights-tabs" aria-label="Navegação do Insights">
              <SelectionIndicator containerRef={insightsRef} value={insightsSection} />
              {INSIGHTS_NAV.map((item) => (
                <NavItem key={item.href} className="product-tab insights-tab" href={item.href} active={insightsSection === item.section}>
                  {item.label}
                </NavItem>
              ))}
            </nav>
          ) : (
            <span className="workspace-context-description">
              {selectedProduct === 'writer' ? 'Preparar pedido' : selectedProduct === 'planner' ? 'Planejar a semana' : 'Visão geral'}
            </span>
          )}
        </div>
      </header>
      <main id="main" className="app-main" tabIndex="-1">
        <div id="workspace-panel" role="tabpanel" aria-labelledby={`app-tab-${selectedProduct}`}>
          {children}
        </div>
      </main>
      <footer className="site-footer">
        <span>EPAVOne · Experiências Práticas em Atividades de Varejo</span>
        <span>Planeje. Inspire. Prepare.</span>
      </footer>
    </div>
  );
}
