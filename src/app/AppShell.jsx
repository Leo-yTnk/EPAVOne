import { useEffect, useRef, useState } from 'preact/hooks';
import { INSIGHTS_NAV, PLANNER_NAV, PRODUCT_META, routeHash } from './routes.js';
import { Button, ContextMenu, NavItem, SelectionIndicator, Tabs, Icon } from '../design-system/components/index.js';

export function AppShell({ route, preferences, account, onOpenAccount, onToggleTheme, children }) {
  const tabsRef = useRef(null);
  const sectionsRef = useRef(null);
  const lastRoutes = useRef({});
  const [wide, setWide] = useState(() => window.matchMedia?.('(min-width: 64rem)').matches ?? true);
  const vertical = preferences?.navigation === 'vertical' && wide;
  const sectionNav = route.product === 'insights' ? INSIGHTS_NAV : route.product === 'planner' ? PLANNER_NAV : null;
  const section = route.segments[0] || '';
  const selectedSection = route.product === 'planner' && section === 'atendimento' ? 'semana' : section === 'home' ? '' : section;
  const activeSection = sectionNav?.some((item) => item.section === selectedSection) ? selectedSection : '';
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
  const shortcuts = [
    ...(sectionNav || []).map((item) => ({
      label: item.label,
      href: item.href,
      icon:
        {
          clientes: 'user',
          semana: 'planner',
          oportunidades: 'insights',
          desempenho: 'difficulty',
          receitas: 'recipe',
          produtos: 'product',
          criacao: 'writer'
        }[item.section] || 'home',
      group: 'Nesta área'
    })),
    ...Object.entries(PRODUCT_META)
      .filter(([key]) => key !== selectedProduct)
      .map(([key, item]) => ({
        label: `Abrir ${item.label}`,
        icon: key,
        group: 'Seus apps',
        onSelect: () => selectApp(key)
      })),
    {
      label: 'Ir ao início da página',
      icon: 'up',
      group: 'Página',
      onSelect: () => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        document.querySelector('#main')?.focus();
      }
    },
    ...(onToggleTheme ? [{ label: 'Alternar tema claro / escuro', icon: 'sun', group: 'Página', onSelect: onToggleTheme }] : [])
  ];

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
                  <span className="app-tab-label" data-product={item.product} data-app={key}>
                    <span className="app-tab-glyph" aria-hidden="true">
                      <Icon name={key} />
                    </span>
                    <span className="app-tab-name">{item.label}</span>
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
        {sectionNav && (
          <nav ref={sectionsRef} className="product-section-nav" aria-label={`Navegação do ${PRODUCT_META[selectedProduct].label}`}>
            <SelectionIndicator containerRef={sectionsRef} value={activeSection} />
            {sectionNav.map((item) => (
              <NavItem key={item.href} className="product-tab section-tab" href={item.href} active={activeSection === item.section}>
                {item.label}
              </NavItem>
            ))}
          </nav>
        )}
      </header>
      <main id="main" className="app-main" tabIndex="-1">
        <div id="workspace-panel" role="tabpanel" aria-labelledby={`app-tab-${selectedProduct}`}>
          <ContextMenu className="workspace-shortcuts" label={`Atalhos do ${PRODUCT_META[selectedProduct].label}`} items={shortcuts}>
            {children}
          </ContextMenu>
        </div>
      </main>
      <footer className="site-footer">
        <span>EPAVOne · Experiências Práticas em Atividades de Varejo</span>
        <span>Planeje. Inspire. Prepare.</span>
      </footer>
    </div>
  );
}
