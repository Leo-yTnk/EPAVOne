export const PRODUCT_META = {
  home: { label: 'One', product: 'one', href: '#/' },
  insights: { label: 'Insights', product: 'insights', href: '#/insights' },
  planner: { label: 'Planner', product: 'planner', href: '#/planner' },
  writer: { label: 'Writer', product: 'writer', href: '#/writer' },
  settings: { label: 'Configurações', product: 'one', href: '#/settings' }
};

export function parseHash(hash = window.location.hash) {
  const raw = hash.startsWith('#/') ? hash.slice(2) : '';
  const segments = raw.split('/').filter(Boolean);

  if (segments[0] === 'settings') return { product: 'settings', segments: [], raw };

  const product = Object.hasOwn(PRODUCT_META, segments[0]) ? segments[0] : 'home';
  let paths = product === 'home' ? [] : segments.slice(1);
  if (product === 'planner') {
    if (paths[0] === 'oportunidades') paths = ['clientes', 'oportunidades', ...paths.slice(1)];
    if (paths[0] === 'desempenho') paths = ['resultados', ...paths.slice(1)];
    if (paths[0] === 'atendimento') paths = ['semana', 'atender', ...paths.slice(1)];
  }
  return { product, segments: paths, raw: product === 'planner' ? ['planner', ...paths].join('/') : raw };
}

export function routeHash(product, segments = []) {
  if (product === 'home') return '#/';
  return '#/' + [product, ...segments].filter(Boolean).join('/');
}

export const INSIGHTS_NAV = [
  { label: 'Home', href: '#/insights', section: '' },
  { label: 'Receitas', href: '#/insights/receitas', section: 'receitas' },
  { label: 'Produtos', href: '#/insights/produtos', section: 'produtos' },
  { label: 'Criação', href: '#/insights/criacao/receitas', section: 'criacao' }
];

export const PLANNER_NAV = [
  { label: 'Pedidos', href: '#/planner/pedidos', section: 'pedidos' },
  { label: 'Início', href: '#/planner', section: '' },
  { label: 'Clientes', href: '#/planner/clientes', section: 'clientes' },
  { label: 'Semana', href: '#/planner/semana', section: 'semana' },
  { label: 'Resultados', href: '#/planner/resultados', section: 'resultados' }
];
