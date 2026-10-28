import { initialRouteHash, readPreferences } from './settings/preferences.js';
import { useEffect, useState } from 'preact/hooks';
import { parseHash } from './routes.js';

function readRoute() {
  const route = parseHash();
  if (route.product === 'planner' && window.location.hash !== '#/' + route.raw)
    window.history.replaceState(window.history.state, '', '#/' + route.raw);
  return route;
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => {
    const hash = initialRouteHash(window.location.hash, readPreferences());
    if (hash !== window.location.hash) window.history.replaceState(window.history.state, '', hash);
    return readRoute();
  });

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route;
}
