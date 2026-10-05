import { useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { AppShell } from './AppShell.jsx';
import { useAccount } from './account/useAccount.js';
import { AccountDialog } from './account/AccountDialog.jsx';
import { useHashRoute } from './useHashRoute.js';
import { applyTheme, getInitialTheme } from './theme.js';
import { productTheme } from './productTheme.js';
import { HomePage } from '../products/home/HomePage.jsx';
import { InsightsRoutes } from '../products/insights/InsightsRoutes.jsx';
import { PlannerRoutes } from '../products/planner/PlannerRoutes.jsx';
import { WriterRoutes } from '../products/writer/WriterRoutes.jsx';
import { ComponentLabPage } from '../dev/component-lab/ComponentLabPage.jsx';

export function App() {
  const route = useHashRoute();
  const account = useAccount();
  const [accountOpen, setAccountOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const routeKey = [route.product, ...route.segments].join('/');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useLayoutEffect(() => {
    document.documentElement.dataset.product = productTheme(route.product === 'dev' ? 'home' : route.product);
    document.documentElement.dataset.page = route.product;
  }, [route.product]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const frame = requestAnimationFrame(() => {
      if (!document.activeElement?.closest('[role="tablist"]')) document.querySelector('#main')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [routeKey]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  let page = <HomePage />;
  if (route.product === 'insights') page = <InsightsRoutes route={route} account={account} onOpenAccount={() => setAccountOpen(true)} />;
  if (route.product === 'planner') page = <PlannerRoutes route={route} />;
  if (route.product === 'writer') page = null;
  if (route.product === 'dev' && route.segments[0] === 'components') page = <ComponentLabPage />;

  return (
    <AppShell route={route} theme={theme} onToggleTheme={toggleTheme} account={account} onOpenAccount={() => setAccountOpen(true)}>
      <div key={routeKey} className="route-frame">
        {page}
      </div>
      <div key="writer-workspace" className="route-frame" hidden={route.product !== 'writer'}>
        <WriterRoutes active={route.product === 'writer'} />
      </div>
      {accountOpen && <AccountDialog account={account} onClose={() => setAccountOpen(false)} />}
    </AppShell>
  );
}
