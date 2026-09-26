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
      <div class="hero-actions"><a class="ds-btn ds-btn-primary" href="#ferramentas">Explorar ferramentas</a><a class="ds-btn ds-btn-secondary" href="#componentes">Ver componentes</a></div>
    </div>
    <aside class="hero-panel ds-stitched-card" aria-label="Etapas de trabalho"><span class="panel-kicker ds-overline">Um fluxo mais simples</span>
      <h2 class="ds-heading-h4">Da ideia ao pedido, passo a passo.</h2>
      <div class="mini-flow"><span><b>1</b> Planeje com o Planner</span><span><b>2</b> Entenda com o Insights</span><span><b>3</b> Prepare com o Writer</span></div>
    </aside>
  </section>

  <section id="ferramentas" aria-labelledby="tools-title">
    <div class="section-heading"><div><span class="section-kicker ds-overline">Ferramentas</span><h2 id="tools-title" class="ds-heading-h2">Escolha por onde começar</h2></div><p class="ds-body-sm-regular">Acesse o espaço de cada ferramenta e conheça seu papel na rotina do EPAV.</p></div>
    <div class="shortcuts">${Object.keys(products).map(card).join('')}</div>
  </section>

  <section id="componentes" class="component-lab" aria-labelledby="components-title">
    <div class="ds-page-header">
      <div class="ds-page-header-copy">
        <span class="section-kicker ds-overline">Component Foundation</span>
        <h2 id="components-title" class="ds-heading-h2">Todos os componentes, em contexto</h2>
        <p>Valores fictícios para validar visual, estados, densidade, acessibilidade e comportamento antes de migrar o EPAVInsights.</p>
      </div>
      <div class="ds-inline">
        <span class="ds-badge is-success">Fundação ativa</span>
        <span class="ds-badge is-info">Dados fictícios</span>
      </div>
    </div>

    <div class="lab-section">
      <div class="lab-section-head"><div><span class="ds-overline">Interação</span><h3 class="ds-heading-h3">Buttons, inputs e seletores</h3></div><p>Estados principais e controles essenciais.</p></div>
      <div class="lab-grid lab-grid-2">
        <article class="ds-card lab-card">
          <h4 class="ds-heading-h5">Button e IconButton</h4>
          <div class="ds-inline">
            <button class="ds-btn ds-btn-primary">Primário</button>
            <button class="ds-btn ds-btn-secondary">Secundário</button>
            <button class="ds-btn ds-btn-ghost">Ghost</button>
            <button class="ds-btn ds-btn-danger">Excluir</button>
            <button class="ds-btn ds-btn-primary is-loading"><span class="ds-spinner" aria-hidden="true"></span><span>Salvando</span></button>
            <button class="ds-btn ds-btn-secondary" disabled>Desabilitado</button>
          </div>
          <div class="ds-inline">
            <button class="ds-icon-btn ds-icon-btn-sm" aria-label="Anterior">←</button>
            <button class="ds-icon-btn" aria-label="Favoritar">♡</button>
            <button class="ds-icon-btn ds-icon-btn-lg" aria-label="Adicionar">＋</button>
            <button class="ds-icon-btn" aria-label="Indisponível" disabled>⋯</button>
          </div>
        </article>

        <article class="ds-card lab-card">
          <h4 class="ds-heading-h5">Inputs, Select e Option</h4>
          <div class="ds-stack">
            <div>
              <label class="ds-input-label" for="lab-name">Cliente</label>
              <input id="lab-name" class="ds-input" value="Marina Oliveira">
              <span class="ds-input-helper">Exemplo de campo preenchido.</span>
            </div>
            <div>
              <label class="ds-input-label" for="lab-error">Código promocional</label>
              <input id="lab-error" class="ds-input is-error" value="EPAV-000">
              <span class="ds-input-error">Código fictício inválido.</span>
            </div>
            <div>
              <label class="ds-input-label" for="lab-category">Select nativo</label>
              <select id="lab-category" class="ds-select">
                <option>Suínos</option>
                <option>Aves</option>
                <option>Bovinos</option>
                <option>Pescados</option>
              </select>
            </div>
            <div>
              <span class="ds-input-label" id="lab-selectbox-label">Select + Option padronizados</span>
              <div class="ds-selectbox" data-ds-selectbox>
                <button class="ds-select-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="lab-selectbox-label lab-selectbox-value" data-ds-select-trigger>
                  <span id="lab-selectbox-value" data-ds-select-value>Suínos</span><span aria-hidden="true">⌄</span>
                </button>
                <div class="ds-select-menu" role="listbox" aria-labelledby="lab-selectbox-label" data-ds-select-menu hidden>
                  <button class="ds-option" role="option" aria-selected="true" data-value="Suínos">Suínos</button>
                  <button class="ds-option" role="option" aria-selected="false" data-value="Aves">Aves</button>
                  <button class="ds-option" role="option" aria-selected="false" data-value="Bovinos">Bovinos</button>
                  <button class="ds-option" role="option" aria-selected="false" data-value="Pescados">Pescados</button>
                  <button class="ds-option" role="option" aria-selected="false" aria-disabled="true" disabled data-value="Congelados">Congelados</button>
                </div>
              </div>
              <span class="ds-input-helper">Menu customizado com selected, hover, disabled e teclado.</span>
            </div>
          </div>
        </article>

        <article class="ds-card lab-card">
          <h4 class="ds-heading-h5">Checkbox, Radio e Switch</h4>
          <div class="ds-stack">
            <label class="ds-checkbox"><input type="checkbox" checked><span class="ds-checkbox-control">✓</span><span>Somente produtos em promoção</span></label>
            <label class="ds-checkbox"><input type="checkbox"><span class="ds-checkbox-control">✓</span><span>Mostrar indisponíveis</span></label>
            <label class="ds-checkbox"><input type="checkbox" disabled><span class="ds-checkbox-control">✓</span><span>Opção indisponível</span></label>
            <div class="ds-divider"></div>
            <label class="ds-radio"><input type="radio" name="lab-period" checked><span class="ds-radio-control"></span><span>Semana atual</span></label>
            <label class="ds-radio"><input type="radio" name="lab-period"><span class="ds-radio-control"></span><span>Mês</span></label>
            <label class="ds-switch"><input type="checkbox" checked><span class="ds-switch-track"><span class="ds-switch-thumb"></span></span><span>Atualização automática</span></label>
          </div>
        </article>

        <article class="ds-card lab-card">
          <h4 class="ds-heading-h5">Slider / Range</h4>
          <div class="ds-slider-field">
            <div class="ds-slider-head"><label class="ds-input-label" for="lab-slider">Meta semanal</label><output id="lab-slider-value" class="ds-slider-value">68%</output></div>
            <input id="lab-slider" class="ds-slider" type="range" min="0" max="100" value="68" style="--slider-progress:68%" data-output="lab-slider-value">
            <span class="ds-input-helper">Arraste para testar foco, thumb e preenchimento.</span>
          </div>
          <div class="ds-slider-field">
            <div class="ds-slider-head"><span class="ds-input-label">Desabilitado</span><span class="ds-slider-value">40%</span></div>
            <input class="ds-slider" type="range" min="0" max="100" value="40" style="--slider-progress:40%" disabled>
          </div>
        </article>
      </div>
    </div>

    <div class="lab-section">
      <div class="lab-section-head"><div><span class="ds-overline">Navegação e estrutura</span><h3 class="ds-heading-h3">Navs, Tabs e layout</h3></div><p>Mesmos contratos para shell, subrotas e filtros.</p></div>
      <div class="lab-grid lab-grid-2">
        <article class="ds-card lab-card">
          <h4 class="ds-heading-h5">Nav + Tabs + Breadcrumb</h4>
          <nav class="ds-nav" aria-label="Navegação de demonstração">
            <a class="ds-nav-item is-active" href="#componentes">Visão geral</a>
            <a class="ds-nav-item" href="#componentes">Produtos</a>
            <a class="ds-nav-item" href="#componentes">Clientes</a>
            <button class="ds-nav-item" disabled>Admin</button>
          </nav>
          <nav class="ds-breadcrumb" aria-label="Breadcrumb de demonstração"><a href="#/">EPAVOne</a><span>/</span><a href="#componentes">Insights</a><span>/</span><span aria-current="page">Clientes</span></nav>
          <div class="ds-tabs" role="tablist" aria-label="Tabs de demonstração">
            <button class="ds-tab is-active" role="tab" aria-selected="true" data-lab-tab="resumo">Resumo</button>
            <button class="ds-tab" role="tab" aria-selected="false" data-lab-tab="pedidos">Pedidos</button>
            <button class="ds-tab" role="tab" aria-selected="false" data-lab-tab="historico">Histórico</button>
            <button class="ds-tab" role="tab" disabled>Bloqueado</button>
          </div>
          <div class="lab-tab-panel" data-lab-panel="resumo">Resumo fictício: 12 clientes ativos e R$ 3.420 em vendas.</div>
          <div class="lab-tab-panel" data-lab-panel="pedidos" hidden>Pedidos fictícios: 18 pedidos na semana.</div>
          <div class="lab-tab-panel" data-lab-panel="historico" hidden>Histórico fictício: crescimento de 14% no mês.</div>
        </article>

        <article class="ds-card lab-card">
          <h4 class="ds-heading-h5">Sidebar + primitives</h4>
          <div class="lab-sidebar-demo">
            <aside class="ds-sidebar">
              <a class="ds-nav-item is-active" href="#componentes">Dashboard</a>
              <a class="ds-nav-item" href="#componentes">Produtos</a>
              <a class="ds-nav-item" href="#componentes">Receitas</a>
              <a class="ds-nav-item" href="#componentes">Perfil</a>
            </aside>
            <div class="ds-stack lab-primitive-surface">
              <strong>Stack / Inline / Grid / Divider</strong>
              <div class="ds-inline"><span class="ds-tag">Semana 39</span><span class="ds-tag">8º ano</span><span class="ds-tag">EPAV</span></div>
              <hr class="ds-divider">
              <div class="ds-grid lab-mini-grid" style="--grid-columns:3"><span>A</span><span>B</span><span>C</span></div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div class="lab-section">
      <div class="lab-section-head"><div><span class="ds-overline">Insights</span><h3 class="ds-heading-h3">Métricas, filtros, gráfico e tabela</h3></div><p>Amostra do que o primeiro dashboard vai exigir.</p></div>

      <div class="ds-toolbar">
        <div class="ds-toolbar-group"><strong>Visão geral</strong><span class="ds-badge">Semana 39</span></div>
        <div class="ds-toolbar-group"><button class="ds-btn ds-btn-secondary ds-btn-sm">Exportar</button><button class="ds-btn ds-btn-primary ds-btn-sm">Novo relatório</button></div>
      </div>

      <div class="ds-filter-bar lab-filter-bar">
        <div class="ds-filter-control"><label class="ds-input-label" for="filter-seller">Vendedor</label><select id="filter-seller" class="ds-select"><option>Todos</option><option>Leonardo</option><option>Clara</option><option>Gama</option></select></div>
        <div class="ds-filter-control"><label class="ds-input-label" for="filter-category">Categoria</label><select id="filter-category" class="ds-select"><option>Todas</option><option>Suínos</option><option>Aves</option><option>Pescados</option></select></div>
        <div class="ds-filter-control lab-date-control"><span class="ds-input-label">Período</span><div class="ds-date-range"><input class="ds-input" type="date" value="2026-09-21" aria-label="Data inicial"><span class="ds-date-range-separator">até</span><input class="ds-input" type="date" value="2026-09-26" aria-label="Data final"></div></div>
      </div>

      <div class="lab-metrics">
        <article class="ds-metric-card"><span class="ds-metric-label">Vendas</span><strong class="ds-metric-value">R$ 3.420</strong><span class="ds-metric-trend is-positive">↑ 14,2%</span></article>
        <article class="ds-metric-card"><span class="ds-metric-label">Pedidos</span><strong class="ds-metric-value">18</strong><span class="ds-metric-trend is-positive">↑ 3</span></article>
        <article class="ds-metric-card"><span class="ds-metric-label">Ticket médio</span><strong class="ds-metric-value">R$ 190</strong><span class="ds-metric-trend is-neutral">→ estável</span></article>
        <article class="ds-metric-card"><span class="ds-metric-label">Conversão</span><strong class="ds-metric-value">42%</strong><span class="ds-metric-trend is-negative">↓ 2,1 p.p.</span></article>
      </div>

      <div class="lab-grid lab-grid-chart">
        <article class="ds-chart-container">
          <div class="ds-chart-header"><div><div class="ds-chart-title">Vendas por dia</div><div class="ds-chart-subtitle">Valores fictícios, em R$</div></div><div class="ds-chart-legend"><span><i></i>Vendas</span></div></div>
          <div class="ds-chart-plot" role="img" aria-label="Gráfico fictício de vendas de segunda a sábado">
            <div class="ds-chart-bar" style="--bar-height:45%" data-label="Seg" title="R$ 410"></div>
            <div class="ds-chart-bar" style="--bar-height:62%" data-label="Ter" title="R$ 560"></div>
            <div class="ds-chart-bar" style="--bar-height:51%" data-label="Qua" title="R$ 480"></div>
            <div class="ds-chart-bar" style="--bar-height:78%" data-label="Qui" title="R$ 720"></div>
            <div class="ds-chart-bar" style="--bar-height:68%" data-label="Sex" title="R$ 630"></div>
            <div class="ds-chart-bar" style="--bar-height:83%" data-label="Sáb" title="R$ 620"></div>
          </div>
        </article>

        <article class="ds-card lab-card">
          <h4 class="ds-heading-h5">DataTable</h4>
          <div class="ds-table-wrap">
            <table class="ds-data-table">
              <thead><tr><th>Produto</th><th>Categoria</th><th class="is-numeric">Qtd.</th><th class="is-numeric">Receita</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td>Linguiça Toscana</td><td>Suínos</td><td class="is-numeric">14</td><td class="is-numeric">R$ 418</td><td><span class="ds-badge is-success">Alta</span></td></tr>
                <tr><td>Filé de Peito</td><td>Aves</td><td class="is-numeric">9</td><td class="is-numeric">R$ 287</td><td><span class="ds-badge is-info">Média</span></td></tr>
                <tr><td>Salmão</td><td>Pescados</td><td class="is-numeric">4</td><td class="is-numeric">R$ 236</td><td><span class="ds-badge">Regular</span></td></tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>

    <div class="lab-section">
      <div class="lab-section-head"><div><span class="ds-overline">Feedback</span><h3 class="ds-heading-h3">Loading, estados, alertas e overlays</h3></div><p>Estados que não podem faltar em uma aplicação de dados.</p></div>
      <div class="lab-grid lab-grid-2">
        <article class="ds-card lab-card">
          <h4 class="ds-heading-h5">Skeleton + Spinner</h4>
          <div class="ds-inline"><span class="ds-spinner ds-spinner-lg" aria-label="Carregando"></span><span>Carregando indicadores…</span></div>
          <div class="ds-stack"><div class="ds-skeleton ds-skeleton-title"></div><div class="ds-skeleton ds-skeleton-line"></div><div class="ds-skeleton ds-skeleton-line" style="width:82%"></div><div class="ds-skeleton ds-skeleton-line" style="width:63%"></div></div>
        </article>

        <article class="ds-card lab-card">
          <h4 class="ds-heading-h5">Alert</h4>
          <div class="ds-stack">
            <div class="ds-alert is-info"><span>ⓘ</span><div><strong>Informação</strong><p>Os dados são apenas uma demonstração visual.</p></div></div>
            <div class="ds-alert is-success"><span>✓</span><div><strong>Importação concluída</strong><p>18 pedidos fictícios foram carregados.</p></div></div>
            <div class="ds-alert is-warning"><span>!</span><div><strong>Atenção</strong><p>Dois registros precisam de revisão.</p></div></div>
            <div class="ds-alert is-danger"><span>×</span><div><strong>Falha de sincronização</strong><p>Tente atualizar novamente.</p></div></div>
          </div>
        </article>

        <article class="ds-state">
          <span class="ds-state-icon">＋</span><h3>EmptyState</h3><p>Nenhum pedido encontrado para os filtros selecionados.</p><button class="ds-btn ds-btn-primary ds-btn-sm">Criar pedido fictício</button>
        </article>

        <article class="ds-state is-error">
          <span class="ds-state-icon">!</span><h3>ErrorState</h3><p>Não foi possível carregar os indicadores fictícios.</p><button class="ds-btn ds-btn-secondary ds-btn-sm">Tentar novamente</button>
        </article>

        <article class="ds-card lab-card">
          <h4 class="ds-heading-h5">Dialog, Drawer, Toast e Tooltip</h4>
          <div class="ds-inline">
            <button class="ds-btn ds-btn-primary" data-lab-action="open-dialog">Abrir dialog</button>
            <button class="ds-btn ds-btn-secondary" data-lab-action="open-drawer">Abrir drawer</button>
            <button class="ds-btn ds-btn-ghost" data-lab-action="show-toast">Mostrar toast</button>
            <span class="ds-tooltip-host"><button class="ds-icon-btn" aria-describedby="lab-tooltip">?</button><span id="lab-tooltip" role="tooltip" class="ds-tooltip">Tooltip acessível por hover ou foco</span></span>
          </div>
        </article>

        <article class="ds-card lab-card">
          <h4 class="ds-heading-h5">Badge + Tag</h4>
          <div class="ds-inline"><span class="ds-badge">Default</span><span class="ds-badge is-info">Info</span><span class="ds-badge is-success">Sucesso</span><span class="ds-badge is-danger">Erro</span></div>
          <div class="ds-inline"><span class="ds-tag">Suínos</span><span class="ds-tag">Semana 39</span><button class="ds-tag is-removable" type="button" data-lab-action="remove-tag">Promoção ×</button></div>
        </article>
      </div>
    </div>

    <div id="lab-dialog-overlay" class="ds-dialog-overlay" hidden>
      <section class="ds-dialog" role="dialog" aria-modal="true" aria-labelledby="lab-dialog-title" tabindex="-1">
        <h3 id="lab-dialog-title" class="ds-dialog-title">Confirmar ação</h3>
        <div class="ds-dialog-content">Este dialog usa dados fictícios e serve apenas para validar o componente.</div>
        <div class="ds-dialog-actions"><button class="ds-btn ds-btn-secondary" data-lab-action="close-dialog">Cancelar</button><button class="ds-btn ds-btn-primary" data-lab-action="close-dialog">Confirmar</button></div>
      </section>
    </div>

    <div id="lab-drawer-overlay" class="ds-drawer-overlay" hidden>
      <aside class="ds-drawer" role="dialog" aria-modal="true" aria-labelledby="lab-drawer-title" tabindex="-1">
        <div class="ds-drawer-header"><h3 id="lab-drawer-title" class="ds-drawer-title">Filtros avançados</h3><button class="ds-icon-btn" aria-label="Fechar drawer" data-lab-action="close-drawer">×</button></div>
        <div class="ds-stack">
          <label class="ds-input-label" for="drawer-client">Cliente</label><input id="drawer-client" class="ds-input" value="Marina Oliveira">
          <label class="ds-input-label" for="drawer-status">Status</label><select id="drawer-status" class="ds-select"><option>Todos</option><option>Confirmado</option><option>Pendente</option></select>
          <label class="ds-switch"><input type="checkbox" checked><span class="ds-switch-track"><span class="ds-switch-thumb"></span></span><span>Somente oportunidades</span></label>
          <button class="ds-btn ds-btn-primary" data-lab-action="close-drawer">Aplicar filtros</button>
        </div>
      </aside>
    </div>

    <div id="lab-toast-region" class="lab-toast-region" aria-live="polite" aria-atomic="true"></div>
  </section>`;
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
  if (key === 'home') return 'home';
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
  selectTab(route.key);
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
    let timeout;
    const finish = event => {
      if (event && event.target !== element) return;
      element.removeEventListener('animationend', finish);
      clearTimeout(timeout);
      resolve();
    };
    element.addEventListener('animationend', finish);
    timeout = setTimeout(finish, 320);
  });
}

async function render() {
  requestedRoute = parseRoute();

  if (renderedSignature === signature(requestedRoute) && location.hash === '#ferramentas') {
    requestAnimationFrame(() => document.querySelector('#ferramentas')?.scrollIntoView());
  }
  if (transitionRunning) return;
  transitionRunning = true;

  try {
    // Always compare against the latest requested route. Hash changes can arrive
    // while either animation is awaiting completion, so a captured signature
    // would keep this loop chasing an obsolete destination forever.
    while (renderedSignature !== signature(requestedRoute)) {
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
  } finally {
    transitionRunning = false;
  }
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


let labLastFocus = null;


function closeSelectbox(selectbox, { focusTrigger = false } = {}) {
  if (!selectbox) return;
  const trigger = selectbox.querySelector('[data-ds-select-trigger]');
  const menu = selectbox.querySelector('[data-ds-select-menu]');
  trigger?.setAttribute('aria-expanded', 'false');
  if (menu) menu.hidden = true;
  menu?.querySelectorAll('.ds-option').forEach(option => option.classList.remove('is-highlighted'));
  if (focusTrigger) trigger?.focus();
}

function openSelectbox(selectbox) {
  if (!selectbox) return;
  document.querySelectorAll('[data-ds-selectbox]').forEach(other => {
    if (other !== selectbox) closeSelectbox(other);
  });
  const trigger = selectbox.querySelector('[data-ds-select-trigger]');
  const menu = selectbox.querySelector('[data-ds-select-menu]');
  trigger?.setAttribute('aria-expanded', 'true');
  if (menu) menu.hidden = false;
  const selected = menu?.querySelector('.ds-option[aria-selected="true"]:not(:disabled)') || menu?.querySelector('.ds-option:not(:disabled)');
  selected?.classList.add('is-highlighted');
  selected?.focus();
}

function selectOption(option) {
  if (!option || option.disabled || option.getAttribute('aria-disabled') === 'true') return;
  const selectbox = option.closest('[data-ds-selectbox]');
  const value = selectbox?.querySelector('[data-ds-select-value]');
  selectbox?.querySelectorAll('.ds-option').forEach(item => item.setAttribute('aria-selected', String(item === option)));
  if (value) value.textContent = option.dataset.value || option.textContent.trim();
  closeSelectbox(selectbox, { focusTrigger: true });
}


function setSliderProgress(input) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value);
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;
  input.style.setProperty('--slider-progress', `${progress}%`);
  const outputId = input.dataset.output;
  if (outputId) {
    const output = document.getElementById(outputId);
    if (output) output.textContent = `${value}%`;
  }
}

function openLabOverlay(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  labLastFocus = document.activeElement;
  overlay.hidden = false;
  document.body.classList.add('ds-no-scroll');
  requestAnimationFrame(() => overlay.querySelector('[role="dialog"]')?.focus());
}

function closeLabOverlay(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove('ds-no-scroll');
  labLastFocus?.focus?.();
  labLastFocus = null;
}

function showLabToast() {
  const region = document.getElementById('lab-toast-region');
  if (!region) return;
  region.innerHTML = '<div class="ds-toast is-success" role="status"><div class="ds-toast-content"><strong>Pronto!</strong><br>Toast fictício exibido com sucesso.</div></div>';
  window.setTimeout(() => {
    if (region) region.innerHTML = '';
  }, 3200);
}

main.addEventListener('input', event => {
  if (event.target.matches('.ds-slider')) setSliderProgress(event.target);
});

main.addEventListener('click', event => {
  const selectTrigger = event.target.closest('[data-ds-select-trigger]');
  if (selectTrigger) {
    const selectbox = selectTrigger.closest('[data-ds-selectbox]');
    const expanded = selectTrigger.getAttribute('aria-expanded') === 'true';
    expanded ? closeSelectbox(selectbox) : openSelectbox(selectbox);
    return;
  }

  const option = event.target.closest('.ds-option');
  if (option) {
    selectOption(option);
    return;
  }

  if (!event.target.closest('[data-ds-selectbox]')) {
    document.querySelectorAll('[data-ds-selectbox]').forEach(selectbox => closeSelectbox(selectbox));
  }

  const tab = event.target.closest('[data-lab-tab]');
  if (tab && !tab.disabled) {
    const target = tab.dataset.labTab;
    const tabList = tab.closest('[role="tablist"]');
    tabList?.querySelectorAll('[data-lab-tab]').forEach(item => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    });
    const scope = tab.closest('.lab-card');
    scope?.querySelectorAll('[data-lab-panel]').forEach(panel => {
      panel.hidden = panel.dataset.labPanel !== target;
    });
    return;
  }

  const action = event.target.closest('[data-lab-action]')?.dataset.labAction;
  if (!action) return;
  if (action === 'open-dialog') openLabOverlay('lab-dialog-overlay');
  if (action === 'close-dialog') closeLabOverlay('lab-dialog-overlay');
  if (action === 'open-drawer') openLabOverlay('lab-drawer-overlay');
  if (action === 'close-drawer') closeLabOverlay('lab-drawer-overlay');
  if (action === 'show-toast') showLabToast();
  if (action === 'remove-tag') event.target.closest('.ds-tag')?.remove();
});

document.addEventListener('keydown', event => {
  const option = document.activeElement?.closest?.('.ds-option');
  if (option) {
    const menu = option.closest('[data-ds-select-menu]');
    const selectbox = option.closest('[data-ds-selectbox]');
    const enabled = [...menu.querySelectorAll('.ds-option:not(:disabled)')];
    const index = enabled.indexOf(option);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      option.classList.remove('is-highlighted');
      const next = event.key === 'ArrowDown'
        ? enabled[(index + 1) % enabled.length]
        : enabled[(index - 1 + enabled.length) % enabled.length];
      next.classList.add('is-highlighted');
      next.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(option);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSelectbox(selectbox, { focusTrigger: true });
      return;
    }
  }

  const trigger = document.activeElement?.closest?.('[data-ds-select-trigger]');
  if (trigger && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    openSelectbox(trigger.closest('[data-ds-selectbox]'));
    return;
  }

  const openOverlay = document.querySelector('.ds-dialog-overlay:not([hidden]), .ds-drawer-overlay:not([hidden])');
  if (!openOverlay) return;

  if (event.key === 'Escape') {
    if (openOverlay.id === 'lab-dialog-overlay') closeLabOverlay('lab-dialog-overlay');
    if (openOverlay.id === 'lab-drawer-overlay') closeLabOverlay('lab-drawer-overlay');
    return;
  }

  if (event.key !== 'Tab') return;
  const focusable = [...openOverlay.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && !el.hidden);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener('hashchange', render);
tabNavigation();
selectTab(parseRoute().key);
render();
