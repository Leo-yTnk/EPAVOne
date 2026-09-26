import { useEffect, useState } from 'preact/hooks';
import { AppShell } from './AppShell.jsx';
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
  const [theme,setTheme] = useState(getInitialTheme);

  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => {
    document.documentElement.dataset.product = productTheme(route.product === 'dev' ? 'home' : route.product);
    document.documentElement.dataset.page = route.product;
  }, [route.product]);

  let page = <HomePage/>;
  if (route.product === 'insights') page = <InsightsRoutes route={route}/>;
  if (route.product === 'planner') page = <PlannerRoutes route={route}/>;
  if (route.product === 'writer') page = <WriterRoutes route={route}/>;
  if (route.product === 'dev' && route.segments[0] === 'components') page = <ComponentLabPage/>;

  return <AppShell route={route} theme={theme} onToggleTheme={() => setTheme(current => current==='dark'?'light':'dark')}>{page}</AppShell>;
}
