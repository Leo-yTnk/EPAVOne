import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { useRouteMotion } from './useRouteMotion.js';
import { usePressFeedback } from '../design-system/behaviors/usePressFeedback.js';
import { CommercialReturn } from './CommercialReturn.jsx';
import { AppShell } from './AppShell.jsx';
import { useAccount } from './account/useAccount.js';
import { useHashRoute } from './useHashRoute.js';
import { applyTheme, getInitialTheme } from './theme.js';
import { productTheme } from './productTheme.js';
import { IntroductionPage } from './welcome/IntroductionPage.jsx';
import { hasSeenIntroduction, completeIntroduction } from './welcome/introduction.js';
import { HomePage } from '../products/home/HomePage.jsx';
import { lazy, Suspense } from 'preact/compat';
import { ModalPresence, Spinner } from '../design-system/components/index.js';
import { applyPreferences, readPreferences } from './settings/preferences.js';

const PlannerRoutes = lazy(() => import('../products/planner/PlannerRoutes.jsx').then((module) => ({ default: module.PlannerRoutes })));
const InsightsRoutes = lazy(() => import('../products/insights/InsightsRoutes.jsx').then((module) => ({ default: module.InsightsRoutes })));
const WriterRoutes = lazy(() => import('../products/writer/WriterRoutes.jsx').then((module) => ({ default: module.WriterRoutes })));
const SettingsPage = lazy(() => import('./settings/SettingsPage.jsx').then((module) => ({ default: module.SettingsPage })));
const AccountDialog = lazy(() => import('./account/AccountDialog.jsx').then((module) => ({ default: module.AccountDialog })));

export function App() {
  const route = useHashRoute();
  const [introductionSeen, setIntroductionSeen] = useState(hasSeenIntroduction);
  const showIntroduction = route.product === 'home' && (!introductionSeen || route.raw === 'welcome');
  const finishIntroduction = () => {
    completeIntroduction();
    setIntroductionSeen(true);
    if (route.raw === 'welcome') window.location.hash = '#/';
    requestAnimationFrame(() => document.querySelector('#main')?.focus({ preventScroll: true }));
  };
  const pageRef = useRef(null);
  const writerRef = useRef(null);
  usePressFeedback();
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
  useRouteMotion(route.product === 'writer' ? writerRef : pageRef, routeKey, route.product);

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

  let page = showIntroduction ? <IntroductionPage onComplete={finishIntroduction} /> : <HomePage preferences={preferences} />;
  if (route.product === 'insights') page = <InsightsRoutes route={route} account={account} onOpenAccount={() => setAccountOpen(true)} />;
  if (route.product === 'planner')
    page = (
      <Suspense
        fallback={
          <span data-route-loading>
            <Spinner label="Carregando Planner" />
          </span>
        }
      >
        <PlannerRoutes
          key={account.session?.user?.id || 'guest'}
          route={route}
          account={account}
          onOpenAccount={() => setAccountOpen(true)}
        />
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
      <div ref={pageRef} key={routeKey} className="route-frame">
        <Suspense
          fallback={
            <span data-route-loading>
              <Spinner label="Carregando app" />
            </span>
          }
        >
          {page}
        </Suspense>
      </div>
      <div ref={writerRef} key="writer-workspace" className="route-frame" hidden={route.product !== 'writer'}>
        {writerVisited.current && (
          <Suspense
            fallback={
              <span data-route-loading>
                <Spinner label="Carregando Writer" />
              </span>
            }
          >
            <WriterRoutes active={route.product === 'writer'} />
          </Suspense>
        )}
      </div>
      <ModalPresence>
        {accountOpen && (
          <Suspense fallback={<Spinner label="Carregando conta" />}>
            <AccountDialog account={account} onClose={() => setAccountOpen(false)} />
          </Suspense>
        )}
      </ModalPresence>
    </AppShell>
  );
}
