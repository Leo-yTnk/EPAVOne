import { useEffect, useRef, useState } from 'preact/hooks';
import { INSIGHTS_NAV, PRODUCT_META, routeHash } from './routes.js';
import { Button, NavItem, SelectionIndicator, Tabs, Icon } from '../design-system/components/index.js';

export function AppShell({ route, preferences, account, onOpenAccount, children }) {
  const tabsRef = useRef(null);
  const insightsRef = useRef(null);
  const lastRoutes = useRef({});
  const [wide, setWide] = useState(() => window.matchMedia?.('(min-width: 64rem)').matches ?? true);
  const vertical = preferences?.navigation === 'vertical' && wide;
  const insightsSection = route.segments[0] === 'home' ? '' : route.segments[0] || '';
  const selectedProduct = Object.hasOwn(PRODUCT_META, route.product) ? route.product : 'home';
  useEffect(() => {
    const media = window.matchMedia?.('(min-width: 64rem)');
    if (!media) return;
    const update = () => setWide(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    lastRoutes.current[route.product] = routeHash(route.product, route.segments);
    tabsRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [route, vertical]);

  function selectApp(product) {
    window.location.hash = lastRoutes.current[product] || PRODUCT_META[product].href;
  }

  return (
    <div className={`app-shell navigation-${vertical ? 'vertical' : 'horizontal'}`}>
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      <header className="site-header">
        <div className="workspace-bar">
          <a className="brand" href="#/" aria-label="EPAVOne, página inicial">
            <span className="brand-mark">e.</span>
            <span className="brand-name">
              EPAV<span className="brand-one">One</span>
            </span>
          </a>
          <div ref={tabsRef} className="workspace-apps">
            <Tabs
              label="Apps do EPAVOne"
              className="app-tabs"
              orientation={vertical ? 'vertical' : 'horizontal'}
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
          <Button
            variant="ghost"
            size="sm"
            className="workspace-account"
            onClick={onOpenAccount}
            aria-label={account?.session ? 'Minha conta' : 'Entrar na conta'}
          >
            <Icon name="user" />
            <span className="workspace-account-label">Conta</span>
          </Button>
        </div>
        {selectedProduct === 'insights' && (
          <nav ref={insightsRef} className="insights-tabs" aria-label="Navegação do Insights">
            <SelectionIndicator containerRef={insightsRef} value={insightsSection} />
            {INSIGHTS_NAV.map((item) => (
              <NavItem key={item.href} className="product-tab insights-tab" href={item.href} active={insightsSection === item.section}>
                {item.label}
              </NavItem>
            ))}
          </nav>
        )}
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
