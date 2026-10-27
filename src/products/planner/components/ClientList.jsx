import { useMemo, useRef, useState } from 'preact/hooks';
import { useContentMotion } from '../../../design-system/behaviors/useContentMotion.js';
import { usePlannerView } from '../hooks/usePlannerView.js';
import {
  ActionGroup,
  Badge,
  Button,
  Card,
  EmptyState,
  FieldGrid,
  Input,
  Menu,
  Pagination,
  SectionHeader,
  Select,
  Tabs
} from '../../../design-system/components/index.js';
import { dateLabel, lastInteraction, recommendations, SEGMENTS } from '../models/planner.js';
import { selectClients } from '../models/workspace.js';
import { OfferList } from './OfferList.jsx';

export function ClientList({ state, week, act, busy, onCreate, opportunities = false }) {
  const [view, setView] = usePlannerView('clients', { query: '', segment: '', filter: '', page: 1, campaign: '' });
  const [filtersOpen, setFiltersOpen] = useState(() => Boolean(view.segment || view.filter));
  const [expanded, setExpanded] = useState(null);
  const filtered = useMemo(() => selectClients(state, week, { ...view, opportunities }), [state, week, view, opportunities]);
  const count = Math.max(1, Math.ceil(filtered.length / 8));
  const current = Math.min(view.page, count);
  const shown = filtered.slice((current - 1) * 8, current * 8);
  const resultsRef = useRef(null);
  useContentMotion(resultsRef, JSON.stringify(shown.map((item) => item.id)), 0, 'y');
  const update = (patch) => setView({ ...patch, page: 1 });
  const activeFilters = Boolean(view.segment || view.filter);
  return (
    <>
      <Card className="planner-flow-card">
        <SectionHeader
          title="Sua carteira"
          description={`${state.customers.length} clientes · preferências, conversas e próximos passos`}
          actions={<Button onClick={onCreate}>Novo cliente</Button>}
        />
        <Tabs
          label="Visualização da carteira"
          value={opportunities ? 'opportunities' : 'all'}
          onChange={(value) => {
            window.location.hash = value === 'all' ? '#/planner/clientes' : '#/planner/clientes/oportunidades';
          }}
          items={[
            { value: 'all', label: 'Todos os clientes' },
            { value: 'opportunities', label: 'Oportunidades' }
          ]}
        />
        <div className="planner-search-row">
          <Input
            id="planner-search"
            label="Buscar na carteira"
            type="search"
            placeholder="Nome, posição ou tag"
            value={view.query}
            onInput={(event) => update({ query: event.currentTarget.value })}
          />
          <Button
            variant="secondary"
            aria-expanded={filtersOpen}
            aria-controls="planner-filters"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            Filtros{activeFilters ? ' · ativos' : ''}
          </Button>
        </div>
        {filtersOpen && (
          <FieldGrid id="planner-filters">
            <Select
              label="Segmento"
              value={view.segment}
              options={[{ value: '', label: 'Todos os segmentos' }, ...SEGMENTS.map((value) => ({ value, label: value }))]}
              onChange={(segment) => update({ segment })}
            />
            <Select
              label="Situação"
              value={view.filter}
              options={[
                { value: '', label: 'Todos os clientes' },
                { value: 'intent', label: 'Intenção de compra' },
                { value: 'new', label: 'Sem contato' },
                { value: 'unprepared', label: 'Preparação pendente' },
                { value: 'due', label: 'Combinados até hoje' },
                { value: 'unplanned', label: 'Fora da semana' }
              ]}
              onChange={(filter) => update({ filter })}
            />
          </FieldGrid>
        )}
        {opportunities && (
          <>
            <Select
              label="Campanha ou oportunidade"
              value={view.campaign}
              onChange={(campaign) => update({ campaign })}
              options={[
                { value: '', label: 'Todas as sugestões compatíveis' },
                { value: 'contact', label: 'Sem contato há 21 dias ou mais' },
                ...state.offers.map((offer) => ({ value: offer.id, label: offer.title }))
              ]}
            />
            <p className="planner-muted">Ideias de abordagem, sem confirmação de promoção ou estoque. Restrições são respeitadas.</p>
          </>
        )}
      </Card>
      <p className="planner-muted" role="status">
        {filtered.length} de {state.customers.length} clientes · ordenados por prioridade
      </p>
      <div ref={resultsRef} className="planner-client-list">
        {!filtered.length && (
          <EmptyState
            title={state.customers.length ? 'Nenhum cliente com esses filtros' : 'Sua carteira começa aqui'}
            description="Cadastre um cliente ou ajuste a busca para planejar sua semana."
            actionLabel={state.customers.length ? 'Limpar filtros' : 'Novo cliente'}
            onAction={
              state.customers.length
                ? () => {
                    update({ query: '', segment: '', filter: '', campaign: '' });
                    if (opportunities) window.location.hash = '#/planner/clientes';
                  }
                : onCreate
            }
          />
        )}
        {shown.map((customer) => {
          const planned = week.queue.some((entry) => entry.customerId === customer.id);
          const ideas = recommendations(customer, state.offers).filter(
            (offer) => !view.campaign || view.campaign === 'contact' || offer.id === view.campaign
          );
          return (
            <Card key={customer.id} padding="compact" className="planner-client">
              <div className="planner-client-row">
                <div className="planner-client-identity">
                  <SectionHeader
                    size="sm"
                    as="h3"
                    title={<a href={`#/planner/clientes/${customer.id}`}>{customer.name}</a>}
                    description={`${customer.position || 'Posição não informada'} · ${customer.segment}`}
                  />
                  <p className="planner-muted">Último contato: {dateLabel(lastInteraction(customer, state.interactions)?.date)}</p>
                </div>
                <div className="planner-client-context">
                  <Badge>{customer.intent ? 'Quer comprar' : customer.preparation.trim() ? 'Abordagem pronta' : 'Conhecer melhor'}</Badge>
                  {opportunities && (
                    <p className="planner-muted">{view.campaign === 'contact' ? 'Retomar relacionamento' : ideas[0]?.title}</p>
                  )}
                </div>
                <ActionGroup>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy || planned}
                    onClick={() => act({ type: 'add', customerId: customer.id, weekId: week.id }, 'Cliente adicionado à semana.')}
                  >
                    {planned ? 'Na semana' : 'Adicionar à semana'}
                  </Button>
                  <Menu
                    label={`Ações de ${customer.name}`}
                    triggerLabel="Mais"
                    items={[
                      { label: 'Ver perfil e preparar conversa', href: `#/planner/clientes/${customer.id}` },
                      { label: 'Ver fila da semana', href: '#/planner/semana' }
                    ]}
                  />
                </ActionGroup>
              </div>
              {opportunities && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-expanded={expanded === customer.id}
                    onClick={() => setExpanded(expanded === customer.id ? null : customer.id)}
                  >
                    {expanded === customer.id ? 'Recolher sugestões' : 'Ver sugestões compatíveis'}
                  </Button>
                  {expanded === customer.id && (
                    <OfferList
                      customer={customer}
                      state={{ ...state, offers: state.offers.filter((offer) => ideas.some((idea) => idea.id === offer.id)) }}
                      weekId={week.id}
                      returnTo="#/planner/clientes/oportunidades"
                    />
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>
      {count > 1 && <Pagination page={current} pageCount={count} onChange={(page) => setView({ page })} label="Páginas da carteira" />}
    </>
  );
}
