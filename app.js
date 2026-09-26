const products = {
  insights: {
    name: 'EPAVInsights', glyph: '↗', number: '01',
    summary: 'Entenda os resultados e encontre oportunidades para as próximas vendas.',
    title: 'Decisões mais claras começam com bons dados.',
    lede: 'Um espaço para acompanhar indicadores do EPAV e transformar os resultados em próximos passos.',
    steps: [['Acompanhe', 'Consulte os indicadores de venda.'], ['Entenda', 'Observe padrões e oportunidades.'], ['Aja', 'Use as descobertas no planejamento.']]
  },
  planner: {
    name: 'EPAVPlanner', glyph: '▦', number: '02',
    summary: 'Organize a semana, priorize clientes e planeje uma abordagem de venda.',
    title: 'Uma semana bem planejada faz diferença.',
    lede: 'Organize as ações da semana e prepare o atendimento com foco nos produtos disponíveis.',
    steps: [['Organize', 'Defina as ações e prioridades.'], ['Prepare', 'Considere os produtos disponíveis.'], ['Acompanhe', 'Revise o progresso durante a semana.']]
  },
  writer: {
    name: 'EPAVWriter', glyph: '✎', number: '03',
    summary: 'Prepare o pedido e confira as informações antes do envio ao suporte.',
    title: 'Do atendimento ao pedido, com mais clareza.',
    lede: 'Um ponto de partida para registrar as escolhas do cliente e conferir os dados necessários ao formulário semanal.',
    steps: [['Registre', 'Reúna os dados do aluno e do cliente.'], ['Confira', 'Revise entrega, produtos e quantidades.'], ['Finalize', 'Envie o formulário conferido ao suporte.']]
  }
};

const tabs = [
  { key: 'home', label: 'Início', hash: '#/' },
  ...Object.entries(products).map(([key, product]) => ({ key, label: product.name.replace('EPAV', ''), hash: `#/${key}` }))
];

const insightsNav = [
  { slug: '', label: 'Visão geral' },
  { slug: 'receitas', label: 'Receitas' },
  { slug: 'produtos', label: 'Produtos' },
  { slug: 'indicadores', label: 'Indicadores' },
  { slug: 'historico', label: 'Histórico' },
  { slug: 'perfil', label: 'Perfil' }
];

const main = document.querySelector('#main');
const tabList = document.querySelector('[role="tablist"]');
const navigationStatus = document.querySelector('#navigation-status');
const toggle = document.querySelector('#theme-toggle');

function tabNavigation() {
  tabList.innerHTML = tabs.map(({ key, label }) => `<button class="tab" type="button" role="tab" id="tab-${key}" aria-controls="main" aria-selected="false" tabindex="-1" data-tab="${key}">${label}</button>`).join('');
}

function parseRoute() {
  const raw = location.hash.startsWith('#/') ? location.hash.slice(2) : '';
  const segments = raw.split('/').filter(Boolean);
  const key = Object.hasOwn(products, segments[0]) ? segments[0] : 'home';
  return { key, segments: key === 'home' ? [] : segments.slice(1), raw };
}

function routeHash(key, segments = []) {
  return `#/${[key, ...segments].filter(Boolean).join('/')}`;
}

function navigateTo(key) {
  const destination = tabs.find(tab => tab.key === key) || tabs[0];
  const current = parseRoute();
  if (current.key === destination.key && current.segments.length === 0) render();
  else location.hash = destination.hash;
}

function card(key) {
  const item = products[key];
  return `<a class="ds-card ds-stitched-card shortcut" href="#/${key}" aria-label="Conhecer ${item.name}">
    <span class="shortcut-top"><span class="shortcut-glyph" aria-hidden="true">${item.glyph}</span><span class="shortcut-number ds-overline">${item.number}</span></span>
    <h3 class="ds-heading-h4">${item.name}</h3><p class="ds-body-sm-regular">${item.summary}</p>
    <span class="shortcut-action ds-label-md">Conhecer ferramenta →</span></a>`;
}

function home() {
  return `<section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy"><span class="eyebrow ds-overline">Seu espaço de trabalho no EPAV</span>
      <h1 id="hero-title" class="ds-display-medium">Tudo se conecta. <em>Sua próxima venda também.</em></h1>
      <p class="ds-body-lg-regular">Planeje a semana, entenda seus resultados e prepare os pedidos em um só lugar. Três ferramentas para apoiar cada etapa do seu trabalho.</p>
      <div class="hero-actions"><a class="ds-btn ds-btn-primary" href="#ferramentas">Explorar ferramentas</a><a class="ds-btn ds-btn-secondary" href="#/planner">Começar pelo planejamento</a></div>
    </div>
    <aside class="hero-panel ds-stitched-card" aria-label="Etapas de trabalho"><span class="panel-kicker ds-overline">Um fluxo mais simples</span>
      <h2 class="ds-heading-h4">Da ideia ao pedido, passo a passo.</h2>
      <div class="mini-flow"><span><b>1</b> Planeje com o Planner</span><span><b>2</b> Entenda com o Insights</span><span><b>3</b> Prepare com o Writer</span></div>
    </aside>
  </section>
  <section id="ferramentas" aria-labelledby="tools-title"><div class="section-heading"><div><span class="section-kicker ds-overline">Ferramentas</span><h2 id="tools-title" class="ds-heading-h2">Escolha por onde começar</h2></div><p class="ds-body-sm-regular">Acesse o espaço de cada ferramenta e conheça seu papel na rotina do EPAV.</p></div>
    <div class="shortcuts">${Object.keys(products).map(card).join('')}</div></section>`;
}

function detail(key) {
  const item = products[key];
  return `<section class="detail" aria-labelledby="detail-title"><a class="back-link" href="#/">← Voltar ao início</a>
    <div><span class="eyebrow ds-overline">Ferramenta ${item.number}</span><h1 id="detail-title" class="ds-display-small">${item.title}</h1><p class="detail-lede ds-body-lg-regular">${item.lede}</p></div>
    <div class="ds-card ds-stitched-card detail-panel"><span class="ds-badge">Em desenvolvimento</span><h2 class="ds-heading-h3">${item.name}</h2>
      <ol class="detail-steps">${item.steps.map(([heading, copy]) => `<li><strong>${heading}</strong>${copy}</li>`).join('')}</ol>
      <a class="ds-btn ds-btn-secondary" href="#/">Ver outras ferramentas</a>
    </div></section>`;
}

function insightsWorkspace(route) {
  const [section = '', ...rest] = route.segments;
  const knownSection = insightsNav.some(item => item.slug === section);
  const currentSection = knownSection ? section : '';
  const nav = insightsNav.map(item => {
    const href = item.slug ? routeHash('insights', [item.slug]) : '#/insights';
    const current = item.slug === currentSection && rest.length === 0;
    return `<a href="${href}"${current ? ' aria-current="page"' : ''}>${item.label}</a>`;
  }).join('');

  const labels = route.segments.map(segment => decodeURIComponent(segment).replace(/[-_]/g, ' '));
  const crumbItems = [
    '<a href="#/">EPAVOne</a>',
    '<a href="#/insights">Insights</a>',
    ...labels.map((label, index) => {
      const isLast = index === labels.length - 1;
      const path = route.segments.slice(0, index + 1);
      return isLast ? `<span aria-current="page">${label}</span>` : `<a href="${routeHash('insights', path)}">${label}</a>`;
    })
  ];

  const title = labels.length ? labels.at(-1) : 'Visão geral';
  return `<section class="workspace" aria-labelledby="workspace-title">
    <nav class="crumbs" aria-label="Breadcrumb">${crumbItems.join('<span aria-hidden="true">/</span>')}</nav>
    <span class="eyebrow ds-overline">EPAVInsights</span>
    <h1 id="workspace-title" class="ds-display-small">${title.charAt(0).toUpperCase() + title.slice(1)}</h1>
    <p class="workspace-lede ds-body-lg-regular">Esta rota já está preparada para receber a migração do Yourcipe sem alterar o shell global do EPAVOne.</p>
    <nav class="product-nav" aria-label="Navegação interna do EPAVInsights">${nav}</nav>
    <div class="ds-card ds-stitched-card workspace-panel">
      <span class="ds-badge is-info">Rota preparada</span>
      <h2 class="ds-heading-h3">Shell pronto para conteúdo real</h2>
      <p class="ds-body-md-regular">O dashboard piloto substituirá este estado sem criar CSS específico de página. Rotas profundas permanecem no produto e mantêm a navegação global estável.</p>
      <code class="route-code">${location.hash || '#/insights'}</code>
    </div>
  </section>`;
}

function renderContent(route) {
  if (route.key === 'home') return home();
  if (route.key === 'insights' && route.segments.length) return insightsWorkspace(route);
  return detail(route.key);
}

function productTheme(key) {
  if (key === 'insights') return 'insights';
  if (key === 'writer') return 'writer';
  return 'one';
}

function selectTab(key) {
  tabList.querySelectorAll('[role="tab"]').forEach(tab => {
    const selected = tab.dataset.tab === key;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
}

function commitPage(route) {
  document.documentElement.dataset.product = productTheme(route.key);
  document.documentElement.dataset.page = route.key;
  main.innerHTML = renderContent(route);
  main.setAttribute('role', 'tabpanel');
  main.setAttribute('aria-labelledby', `tab-${route.key}`);

  const pageName = route.key === 'home'
    ? 'EPAVOne — seu espaço de trabalho'
    : route.segments.length
      ? `${decodeURIComponent(route.segments.at(-1)).replace(/[-_]/g, ' ')} — ${products[route.key].name}`
      : `${products[route.key].name} — EPAVOne`;

  document.title = pageName;
  const selectedLabel = tabs.find(tab => tab.key === route.key)?.label || 'Início';
  navigationStatus.textContent = `${selectedLabel} selecionado`;

  if (location.hash === '#ferramentas') requestAnimationFrame(() => document.querySelector('#ferramentas')?.scrollIntoView());
  else window.scrollTo(0, 0);
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let renderedSignature;
let requestedRoute = parseRoute();
let transitionRunning = false;

function signature(route) {
  return [route.key, ...route.segments].join('/');
}

function waitForAnimation(element) {
  return new Promise(resolve => {
    const finish = () => resolve();
    element.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 320);
  });
}

async function render() {
  requestedRoute = parseRoute();
  const requestedSignature = signature(requestedRoute);
  selectTab(requestedRoute.key, renderedSignature !== undefined);

  if (renderedSignature === requestedSignature && location.hash === '#ferramentas') {
    requestAnimationFrame(() => document.querySelector('#ferramentas')?.scrollIntoView());
  }
  if (transitionRunning) return;
  transitionRunning = true;

  while (renderedSignature !== requestedSignature) {
    if (renderedSignature !== undefined && !reducedMotion.matches) {
      main.classList.add('page-leaving');
      await waitForAnimation(main);
      main.classList.remove('page-leaving');
    }

    const nextRoute = requestedRoute;
    const previousKey = renderedSignature?.split('/')[0] || 'home';
    const previousIndex = tabs.findIndex(tab => tab.key === previousKey);
    const nextIndex = tabs.findIndex(tab => tab.key === nextRoute.key);
    main.classList.toggle('page-forward', nextIndex >= previousIndex);
    main.classList.toggle('page-backward', nextIndex < previousIndex);
    commitPage(nextRoute);
    renderedSignature = signature(nextRoute);

    if (!reducedMotion.matches) {
      main.classList.add('page-entering');
      await waitForAnimation(main);
      main.classList.remove('page-entering');
    }

    requestedRoute = parseRoute();
  }

  transitionRunning = false;
}

function setTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
  toggle.querySelector('[aria-hidden="true"]').textContent = dark ? '☀' : '◐';
}

try { setTheme(localStorage.getItem('epavone-theme') === 'dark'); } catch { setTheme(false); }
toggle.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  setTheme(dark);
  try { localStorage.setItem('epavone-theme', dark ? 'dark' : 'light'); } catch { /* armazenamento indisponível */ }
});
tabList.addEventListener('click', event => {
  const tab = event.target.closest('[role="tab"]');
  if (tab) navigateTo(tab.dataset.tab);
});
tabList.addEventListener('keydown', event => {
  const tabButtons = [...tabList.querySelectorAll('[role="tab"]')];
  const currentIndex = tabButtons.indexOf(document.activeElement);
  if (currentIndex < 0) return;
  const destinations = {
    ArrowRight: (currentIndex + 1) % tabButtons.length,
    ArrowLeft: (currentIndex - 1 + tabButtons.length) % tabButtons.length,
    Home: 0,
    End: tabButtons.length - 1
  };
  if (!(event.key in destinations)) return;
  event.preventDefault();
  const destination = tabButtons[destinations[event.key]];
  destination.focus();
  navigateTo(destination.dataset.tab);
});
window.addEventListener('hashchange', render);
tabNavigation();
selectTab(parseRoute().key);
render();
