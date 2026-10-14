import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { CommercialReturn } from './CommercialReturn.jsx';
import { AppShell } from './AppShell.jsx';
import { useAccount } from './account/useAccount.js';
import { useHashRoute } from './useHashRoute.js';
import { applyTheme, getInitialTheme } from './theme.js';
import { productTheme } from './productTheme.js';
import { HomePage } from '../products/home/HomePage.jsx';
import { lazy, Suspense } from 'preact/compat';
import { Spinner } from '../design-system/components/index.js';
import { applyPreferences, readPreferences } from './settings/preferences.js';

const PlannerRoutes = lazy(() => import('../products/planner/PlannerRoutes.jsx').then((module) => ({ default: module.PlannerRoutes })));
const InsightsRoutes = lazy(() => import('../products/insights/InsightsRoutes.jsx').then((module) => ({ default: module.InsightsRoutes })));
const WriterRoutes = lazy(() => import('../products/writer/WriterRoutes.jsx').then((module) => ({ default: module.WriterRoutes })));
const SettingsPage = lazy(() => import('./settings/SettingsPage.jsx').then((module) => ({ default: module.SettingsPage })));
const AccountDialog = lazy(() => import('./account/AccountDialog.jsx').then((module) => ({ default: module.AccountDialog })));

export function App() {
  const route = useHashRoute();
  const writerVisited = useRef(false);
  if (route.product === 'writer') writerVisited.current = true;
  const account = useAccount();
  const [accountOpen, setAccountOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [preferences, setPreferences] = useState(readPreferences);
  const [preferencesStatus, setPreferencesStatus] = useState('Salvo neste navegador');
  useEffect(() => {
    setPreferencesStatus(
      applyPreferences(preferences) ? 'Salvo neste navegador' : 'Não foi possível salvar. Suas preferências estão aplicadas nesta sessão.'
    );
  }, [preferences]);
  const routeKey = [route.product, ...route.segments].join('/');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useLayoutEffect(() => {
    document.documentElement.dataset.product = productTheme(route.product === 'settings' ? 'home' : route.product);
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

  let page = <HomePage preferences={preferences} />;
  if (route.product === 'insights') page = <InsightsRoutes route={route} account={account} onOpenAccount={() => setAccountOpen(true)} />;
  if (route.product === 'planner')
    page = (
      <Suspense fallback={<Spinner label="Carregando Planner" />}>
        <PlannerRoutes key={account.session?.user?.id || 'guest'} route={route} account={account} />
      </Suspense>
    );
  if (route.product === 'writer') page = null;
  if (route.product === 'settings')
    page = (
      <SettingsPage
        theme={theme}
        onToggleTheme={toggleTheme}
        preferences={preferences}
        saveStatus={preferencesStatus}
        onPreferencesChange={(next) => {
          setPreferencesStatus('Salvando…');
          setPreferences(next);
        }}
        account={account}
        onOpenAccount={() => setAccountOpen(true)}
      />
    );

  return (
    <AppShell
      preferences={preferences}
      route={route}
      theme={theme}
      onToggleTheme={toggleTheme}
      account={account}
      onOpenAccount={() => setAccountOpen(true)}
    >
      {['insights', 'writer'].includes(route.product) && <CommercialReturn />}
      <div key={routeKey} className="route-frame">
        <Suspense fallback={<Spinner label="Carregando app" />}>{page}</Suspense>
      </div>
      <div key="writer-workspace" className="route-frame" hidden={route.product !== 'writer'}>
        {writerVisited.current && (
          <Suspense fallback={<Spinner label="Carregando Writer" />}>
            <WriterRoutes active={route.product === 'writer'} />
          </Suspense>
        )}
      </div>
      {accountOpen && (
        <Suspense fallback={<Spinner label="Carregando conta" />}>
          <AccountDialog account={account} onClose={() => setAccountOpen(false)} />
        </Suspense>
      )}
    </AppShell>
  );
}
