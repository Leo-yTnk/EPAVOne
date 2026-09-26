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

const main = document.querySelector('#main');
const tabList = document.querySelector('[role="tablist"]');
const navigationStatus = document.querySelector('#navigation-status');
const toggle = document.querySelector('#theme-toggle');

function tabNavigation() {
  tabList.innerHTML = tabs.map(({ key, label }) => `<button class="tab" type="button" role="tab" id="tab-${key}" aria-controls="main" aria-selected="false" tabindex="-1" data-tab="${key}">${label}</button>`).join('');
}

function navigateTo(key) {
  const destination = tabs.find(tab => tab.key === key) || tabs[0];
  if (location.hash === destination.hash) render();
  else location.hash = destination.hash;
}

function card(key) {
  const item = products[key];
  return `<a class="ds-card shortcut" href="#/${key}" aria-label="Conhecer ${item.name}">
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
    <aside class="hero-panel" aria-label="Etapas de trabalho"><span class="panel-kicker ds-overline">Um fluxo mais simples</span>
      <h2 class="ds-heading-h4">Da ideia ao pedido, passo a passo.</h2>
      <div class="mini-flow"><span><b>1</b> Planeje com o Planner</span><span><b>2</b> Entenda com o Insights</span><span><b>3</b> Prepare com o Writer</span></div>
    </aside>
  </section>
  <section id="ferramentas" aria-labelledby="tools-title"><div class="section-heading"><div><span class="ds-overline" style="color:var(--text-brand)">Ferramentas</span><h2 id="tools-title" class="ds-heading-h2">Escolha por onde começar</h2></div><p class="ds-body-sm-regular">Acesse o espaço de cada ferramenta e conheça seu papel na rotina do EPAV.</p></div>
    <div class="shortcuts">${Object.keys(products).map(card).join('')}</div></section>`;
}

function detail(key) {
  const item = products[key];
  return `<section class="detail" aria-labelledby="detail-title"><a class="back-link" href="#/">← Voltar ao início</a>
    <div><span class="eyebrow ds-overline">Ferramenta ${item.number}</span><h1 id="detail-title" class="ds-display-small">${item.title}</h1><p class="detail-lede ds-body-lg-regular">${item.lede}</p></div>
    <div class="ds-card detail-panel"><span class="ds-badge">Em desenvolvimento</span><h2 class="ds-heading-h3">${item.name}</h2>
      <ol class="detail-steps">${item.steps.map(([heading, copy]) => `<li><strong>${heading}</strong>${copy}</li>`).join('')}</ol>
      <a class="ds-btn ds-btn-secondary" href="#/">Ver outras ferramentas</a>
    </div></section>`;
}

function render() {
  const key = location.hash.match(/^#\/(insights|planner|writer)\/?$/)?.[1] || 'home';
  main.innerHTML = key === 'home' ? home() : detail(key);
  main.setAttribute('role', 'tabpanel');
  main.setAttribute('aria-labelledby', `tab-${key}`);
  tabList.querySelectorAll('[role="tab"]').forEach(tab => {
    const selected = tab.dataset.tab === key;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  document.title = key === 'home' ? 'EPAVOne — seu espaço de trabalho' : `${products[key].name} — EPAVOne`;
  navigationStatus.textContent = `${tabs.find(tab => tab.key === key).label} selecionado`;
  if (location.hash === '#ferramentas') {
    requestAnimationFrame(() => document.querySelector('#ferramentas')?.scrollIntoView());
  } else {
    window.scrollTo(0, 0);
  }
}

function setTheme(dark) {
  document.documentElement.classList.toggle('yc-dark', dark);
  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
  toggle.textContent = dark ? 'Modo claro' : 'Modo escuro';
}

try { setTheme(localStorage.getItem('epavone-theme') === 'dark'); } catch { setTheme(false); }
toggle.addEventListener('click', () => {
  const dark = !document.documentElement.classList.contains('yc-dark');
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
  const destinations = { ArrowRight: (currentIndex + 1) % tabButtons.length, ArrowLeft: (currentIndex - 1 + tabButtons.length) % tabButtons.length, Home: 0, End: tabButtons.length - 1 };
  if (!(event.key in destinations)) return;
  event.preventDefault();
  const destination = tabButtons[destinations[event.key]];
  destination.focus();
  navigateTo(destination.dataset.tab);
});
window.addEventListener('hashchange', render);
tabNavigation();
render();
