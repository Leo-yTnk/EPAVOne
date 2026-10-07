import { usePlannerView } from '../hooks/usePlannerView.js';
import { Badge, Button, Card, EmptyState, Heading, Input, Pagination, Select } from '../../../design-system/components/index.js';
import { dateLabel, lastInteraction, priority, SEGMENTS } from '../models/planner.js';
import { PriorityDetails } from './PriorityDetails.jsx';
export function ClientList({ state, week, act, busy, onCreate }) {
  const [view, setView] = usePlannerView('clients', { query: '', segment: '', filter: '', page: 1 });
  const { query, segment, filter, page } = view;
  const setQuery = (query) => setView({ query });
  const setSegment = (segment) => setView({ segment });
  const setFilter = (filter) => setView({ filter });
  const setPage = (page) => setView({ page });
  const fold = (text) =>
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  const filtered = state.customers
    .filter(
      (customer) =>
        fold([customer.name, customer.position, ...customer.tags].join(' ')).includes(fold(query)) &&
        (!segment || customer.segment === segment) &&
        (!filter ||
          (filter === 'intent'
            ? customer.intent
            : filter === 'new'
              ? !lastInteraction(customer, state.interactions)
              : !customer.preparation.trim()))
    )
    .sort((a, b) => priority(b, state).score - priority(a, state).score || a.name.localeCompare(b.name));
  const count = Math.max(1, Math.ceil(filtered.length / 8));
  const current = Math.min(page, count);
  function update(setter, value) {
    setter(value);
    setPage(1);
  }
  return (
    <>
      <div className="planner-toolbar">
        <Input
          id="planner-search"
          label="Buscar na carteira"
          type="search"
          placeholder="Nome, posição ou tag"
          value={query}
          onInput={(event) => update(setQuery, event.currentTarget.value)}
        />
        <Select
          label="Segmento"
          value={segment}
          options={[{ value: '', label: 'Todos os segmentos' }, ...SEGMENTS.map((value) => ({ value, label: value }))]}
          onChange={(value) => update(setSegment, value)}
        />
        <Select
          label="Situação"
          value={filter}
          options={[
            { value: '', label: 'Todos os clientes' },
            { value: 'intent', label: 'Intenção de compra' },
            { value: 'new', label: 'Sem contato' },
            { value: 'unprepared', label: 'Preparação pendente' }
          ]}
          onChange={(value) => update(setFilter, value)}
        />
      </div>
      <div className="planner-section-head">
        <p role="status" className="planner-muted">
          {filtered.length} de {state.customers.length} clientes · ordenados por prioridade
        </p>
        <Button variant="secondary" onClick={onCreate}>
          Novo cliente
        </Button>
      </div>
      {!filtered.length && (
        <EmptyState
          title={state.customers.length ? 'Nenhum cliente com esses filtros' : 'Sua carteira começa aqui'}
          description="Cadastre um cliente ou ajuste a busca para planejar sua semana."
          actionLabel={state.customers.length ? 'Limpar filtros' : 'Novo cliente'}
          onAction={
            state.customers.length
              ? () => {
                  setQuery('');
                  setSegment('');
                  setFilter('');
                }
              : onCreate
          }
        />
      )}
      <div className="planner-client-grid">
        {filtered.slice((current - 1) * 8, current * 8).map((customer) => (
          <Card key={customer.id} className="planner-client">
            <div className="planner-section-head">
              <Badge>{customer.segment}</Badge>
              {customer.intent && <span className="planner-muted">Quer comprar</span>}
            </div>
            <Heading level={4}>
              <a href={`#/planner/clientes/${customer.id}`}>{customer.name}</a>
            </Heading>
            <p className="planner-muted">
              {customer.position || 'Posição não informada'} · contato: {dateLabel(lastInteraction(customer, state.interactions)?.date)}
            </p>
            <PriorityDetails customer={customer} state={state} />
            <div className="ds-inline">
              <Button as="a" size="sm" variant="secondary" href={`#/planner/clientes/${customer.id}`}>
                Preparar cliente
              </Button>
              <Button
                size="sm"
                disabled={busy || week.queue.some((entry) => entry.customerId === customer.id)}
                onClick={() => act({ type: 'add', customerId: customer.id, weekId: week.id }, 'Cliente adicionado à semana.')}
              >
                {week.queue.some((entry) => entry.customerId === customer.id) ? 'Na semana' : 'Adicionar à semana'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {count > 1 && <Pagination page={current} pageCount={count} onChange={setPage} label="Páginas da carteira" />}
    </>
  );
}
