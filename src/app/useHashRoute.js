import { useEffect, useState } from 'preact/hooks';
import { parseHash } from './routes.js';

function readRoute() {
  const route = parseHash();
  if (route.product === 'planner' && window.location.hash !== '#/' + route.raw)
    window.history.replaceState(window.history.state, '', '#/' + route.raw);
  return route;
}

export function useHashRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route;
}
