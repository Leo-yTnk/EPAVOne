export const PRODUCT_META = {
  home: { label: 'Início', product: 'home', href: '#/' },
  insights: { label: 'Insights', product: 'insights', href: '#/insights' },
  planner: { label: 'Planner', product: 'one', href: '#/planner' },
  writer: { label: 'Writer', product: 'writer', href: '#/writer' }
};

export function parseHash(hash = window.location.hash) {
  const raw = hash.startsWith('#/') ? hash.slice(2) : '';
  const segments = raw.split('/').filter(Boolean);
  const product = Object.hasOwn(PRODUCT_META, segments[0]) ? segments[0] : 'home';

  return {
    product,
    segments: product === 'home' ? [] : segments.slice(1),
    raw
  };
}

export function routeHash(product, segments = []) {
  if (product === 'home') return '#/';
  return '#/' + [product, ...segments].filter(Boolean).join('/');
}

export function routeSignature(route) {
  return [route.product, ...route.segments].join('/');
}
