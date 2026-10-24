import { AppLogo, Button, Drawer, Icon, NavItem } from '../design-system/components/index.js';
import { PRODUCT_META } from './routes.js';

export function MobileNavigation({ open, onClose, onSelectApp, sectionNav, activeSection, product, onOpenAccount, signedIn }) {
  return (
    <Drawer open={open} onClose={onClose} side="start" title="Seus apps" id="mobile-navigation" className="mobile-sidebar">
      <p className="mobile-sidebar-caption">Tudo para o seu atendimento.</p>
      <nav className="mobile-sidebar-apps" aria-label="Apps do EPAVOne">
        {Object.entries(PRODUCT_META)
          .filter(([key]) => key !== 'settings')
          .map(([key, item]) => (
            <NavItem
              key={key}
              href={item.href}
              aria-label={item.label}
              active={product === key}
              onClick={(event) => {
                event.preventDefault();
                onSelectApp(key);
                onClose();
              }}
            >
              <AppLogo product={item.product} size="lg" /> <span>{item.label}</span>
            </NavItem>
          ))}
      </nav>
      {sectionNav && (
        <nav className="mobile-sidebar-sections" aria-label={`Páginas do ${PRODUCT_META[product].label}`}>
          <span className="ds-overline">{PRODUCT_META[product].label}</span>
          {sectionNav.map((item) => (
            <NavItem key={item.href} href={item.href} active={activeSection === item.section} onClick={onClose}>
              {item.label}
            </NavItem>
          ))}
        </nav>
      )}
      <div className="mobile-sidebar-utilities">
        <NavItem href="#/settings" active={product === 'settings'} onClick={onClose}>
          <Icon name="settings" /> Configurações
        </NavItem>
        <Button
          variant="ghost"
          onClick={() => {
            onClose();
            onOpenAccount?.();
          }}
        >
          <Icon name="user" /> {signedIn ? 'Minha conta' : 'Entrar na conta'}
        </Button>
      </div>
    </Drawer>
  );
}
