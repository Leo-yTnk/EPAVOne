import { CreateMenu } from './CreateMenu.jsx';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { MobileNavigation } from './MobileNavigation.jsx';
import { useHeaderMotion } from './useHeaderMotion.js';
import { INSIGHTS_NAV, PLANNER_NAV, PRODUCT_META, routeHash } from './routes.js';
import { Button, ContextMenu, NavItem, SelectionIndicator, Tabs, Icon, AppLogo } from '../design-system/components/index.js';

export function AppShell({ route, preferences, account, onOpenAccount, onToggleTheme, children }) {
  const tabsRef = useRef(null);
  const navigationRef = useRef(null);
  const sectionsRef = useRef(null);
  const lastRoutes = useRef({});
  const [wide, setWide] = useState(() => window.matchMedia?.('(min-width: 75rem)').matches ?? true);
  const [phone, setPhone] = useState(() => window.matchMedia?.('(max-width: 48rem)').matches ?? false);
  const vertical = preferences?.navigation === 'vertical' && wide;
  const mobileSidebar = !wide && preferences?.mobileNavigation === 'vertical';
  const [navigationOpen, setNavigationOpen] = useState(false);
  const closeNavigation = useCallback(() => setNavigationOpen(false), []);
  const sectionNav = route.product === 'insights' ? INSIGHTS_NAV : route.product === 'planner' ? PLANNER_NAV : null;
  const section = route.segments[0] || '';
  const selectedSection = route.product === 'planner' && section === 'atendimento' ? 'semana' : section === 'home' ? '' : section;
  const activeSection = sectionNav?.some((item) => item.section === selectedSection) ? selectedSection : '';
  const selectedProduct = Object.hasOwn(PRODUCT_META, route.product) ? route.product : 'home';
  const compactHeader = phone && !mobileSidebar;
  const drawerNavigation = mobileSidebar || compactHeader;
  const currentPage = sectionNav?.find((item) => item.section === activeSection)?.label;
  useHeaderMotion(navigationRef, selectedProduct, !vertical && !drawerNavigation);
  useEffect(() => {
    setNavigationOpen(false);
  }, [route.product, route.raw, drawerNavigation]);
  useEffect(() => {
    const media = window.matchMedia?.('(min-width: 75rem)');
    if (!media) return;
    const update = () => setWide(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const media = window.matchMedia?.('(max-width: 48rem)');
    if (!media) return;
    const update = () => setPhone(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    lastRoutes.current[route.product] = routeHash(route.product, route.segments);
  }, [route]);
  useEffect(() => {
    sectionsRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    tabsRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [route.product, activeSection, vertical]);

  function selectApp(product) {
    window.location.hash = lastRoutes.current[product] || PRODUCT_META[product].href;
  }
  const shortcuts = [
    ...(sectionNav || []).map((item) => ({
      label: item.label,
      href: item.href,
      icon: item.icon,
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
    <div
      className={`app-shell navigation-${vertical ? 'vertical' : 'horizontal'}${sectionNav ? ' has-sections' : ''}${mobileSidebar ? ' uses-mobile-sidebar' : ''}`}
    >
      <a className="skip-link" href="#main">
        Ir para o conteúdo
      </a>
      <header className="site-header">
        {mobileSidebar ? (
          <div className="workspace-bar">
            <Button
              className="mobile-navigation-trigger"
              variant="secondary"
              onClick={() => setNavigationOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={navigationOpen}
              aria-controls="mobile-navigation"
            >
              <Icon name="menu" /> Navegação
            </Button>
            <CreateMenu />
          </div>
        ) : (
          <div className="workspace-bar">
            {compactHeader ? (
              <Button
                className="mobile-context-trigger"
                variant="secondary"
                onClick={() => setNavigationOpen(true)}
                aria-label={`Navegação: ${PRODUCT_META[selectedProduct].label}${currentPage ? `, ${currentPage}` : ''}`}
                aria-haspopup="dialog"
                aria-expanded={navigationOpen}
                aria-controls="mobile-navigation"
              >
                <AppLogo product={PRODUCT_META[selectedProduct].product} size="sm" />
                <span key={`${selectedProduct}/${currentPage}`} className="mobile-context-label">
                  <span className="mobile-context-app">{PRODUCT_META[selectedProduct].label}</span>
                  <span className="mobile-context-page">{currentPage || 'Seus apps'}</span>
                </span>
                <Icon name="menu" />
              </Button>
            ) : (
              <>
                <a className="brand" data-product="one" href="#/" aria-label="EPAVOne, página inicial">
                  <AppLogo product="one" />
                  <span className="brand-name">
                    EPAV<span className="brand-one">One</span>
                  </span>
                </a>
                <div ref={navigationRef} className="workspace-navigation">
                  <div className="workspace-navigation-scroll">
                    <div ref={tabsRef} className="workspace-apps">
                      <Tabs
                        label="Apps do EPAVOne"
                        className="app-tabs"
                        orientation={vertical && !sectionNav ? 'vertical' : 'horizontal'}
                        stitchedIndicator
                        value={selectedProduct}
                        onChange={selectApp}
                        items={Object.entries(PRODUCT_META)
                          .filter(([key]) => key !== 'settings')
                          .map(([key, item]) => ({
                            value: key,
                            id: `app-tab-${key}`,
                            panelId: 'workspace-panel',
                            label: (
                              <span className="app-tab-label" data-product={item.product} data-app={key} title={item.label}>
                                <span className="app-tab-glyph" aria-hidden="true">
                                  {key === 'settings' ? <Icon name="settings" /> : <AppLogo product={item.product} size="sm" />}
                                </span>
                                <span className="app-tab-name">{item.label}</span>
                              </span>
                            )
                          }))}
                      />
                    </div>
                    {sectionNav && <span className="workspace-nav-separator" aria-hidden="true" />}
                    {sectionNav && (
                      <nav
                        ref={sectionsRef}
                        className="product-section-nav"
                        aria-label={`Navegação do ${PRODUCT_META[selectedProduct].label}`}
                      >
                        <SelectionIndicator containerRef={sectionsRef} value={`${selectedProduct}/${activeSection}`} stitched />
                        {sectionNav.map((item) => (
                          <NavItem
                            key={item.href}
                            className="product-tab section-tab"
                            href={item.href}
                            active={activeSection === item.section}
                          >
                            <Icon name={item.icon} size="1rem" />
                            <span>{item.label}</span>
                          </NavItem>
                        ))}
                      </nav>
                    )}
                  </div>
                </div>
              </>
            )}
            <div className="workspace-utilities">
              <NavItem
                id="workspace-settings-link"
                className="workspace-settings"
                href="#/settings"
                active={route.product === 'settings'}
                aria-label="Configurações"
                title="Configurações"
              >
                <Icon name="settings" />
                <span className="workspace-settings-label">Configurações</span>
              </NavItem>
              <CreateMenu />
            </div>
          </div>
        )}
      </header>
      {drawerNavigation && (
        <MobileNavigation
          open={navigationOpen}
          onClose={closeNavigation}
          onSelectApp={selectApp}
          sectionNav={sectionNav}
          activeSection={activeSection}
          product={selectedProduct}
          onOpenAccount={onOpenAccount}
          signedIn={Boolean(account?.session)}
        />
      )}
      <main id="main" className="app-main" tabIndex="-1">
        <div
          id="workspace-panel"
          role={drawerNavigation || selectedProduct === 'settings' ? 'region' : 'tabpanel'}
          aria-label={drawerNavigation ? PRODUCT_META[selectedProduct].label : undefined}
          aria-labelledby={
            drawerNavigation ? undefined : selectedProduct === 'settings' ? 'workspace-settings-link' : `app-tab-${selectedProduct}`
          }
        >
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
