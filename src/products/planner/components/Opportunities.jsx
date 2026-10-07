import { usePlannerView } from '../hooks/usePlannerView.js';
import { Button, Card, EmptyState, Heading, Pagination, Select } from '../../../design-system/components/index.js';
import { daysSince, lastInteraction, recommendations, today } from '../models/planner.js';
import { OfferList } from './OfferList.jsx';
export function Opportunities({ state, week, act, busy }) {
  const [view, setView] = usePlannerView('opportunities', { campaign: '', page: 1 });
  const { campaign, page } = view;
  const setCampaign = (campaign) => setView({ campaign });
  const setPage = (page) => setView({ page });
  const customers = state.customers.filter((customer) =>
    campaign === 'contact'
      ? (daysSince(lastInteraction(customer, state.interactions)?.date, today()) ?? 999) >= 21
      : recommendations(customer, state.offers).some((offer) => !campaign || offer.id === campaign)
  );
  const pageCount = Math.max(1, Math.ceil(customers.length / 4));
  const current = Math.min(page, pageCount);
  return (
    <>
      <Select
        label="Campanha ou oportunidade"
        value={campaign}
        onChange={(value) => {
          setCampaign(value);
          setPage(1);
        }}
        options={[
          { value: '', label: 'Todas as sugestões compatíveis' },
          { value: 'contact', label: 'Sem contato há 21 dias ou mais' },
          ...state.offers.map((offer) => ({ value: offer.id, label: offer.title }))
        ]}
      />
      <p className="planner-muted" role="status">
        {customers.length} clientes · sugestões demonstrativas, sem confirmação de estoque ou promoção
      </p>
      <div className="planner-opportunity-list">
        {customers.slice((current - 1) * 4, current * 4).map((customer) => (
          <Card className="planner-flow-card" key={customer.id}>
            <div className="planner-section-head">
              <div>
                <Heading level={3}>
                  <a href={`#/planner/clientes/${customer.id}`}>{customer.name}</a>
                </Heading>
                <p className="planner-muted">
                  {customer.segment} ·{' '}
                  {campaign === 'contact'
                    ? 'Retomar o relacionamento antes de oferecer produtos.'
                    : 'Preferências relacionadas à campanha, após excluir restrições.'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={busy || week.queue.some((entry) => entry.customerId === customer.id)}
                onClick={() => act({ type: 'add', weekId: week.id, customerId: customer.id }, 'Cliente adicionado à semana.')}
              >
                {week.queue.some((entry) => entry.customerId === customer.id) ? 'Na semana' : 'Adicionar à semana'}
              </Button>
            </div>
            <OfferList
              customer={customer}
              state={{
                ...state,
                offers: campaign && campaign !== 'contact' ? state.offers.filter((offer) => offer.id === campaign) : state.offers
              }}
              weekId={week.id}
              returnTo="#/planner/oportunidades"
            />
          </Card>
        ))}
      </div>
      {!customers.length && (
        <EmptyState
          title="Nenhum cliente compatível"
          description="As restrições foram respeitadas. Experimente outra campanha ou complete as preferências da carteira."
        />
      )}
      {pageCount > 1 && <Pagination page={current} pageCount={pageCount} onChange={setPage} label="Páginas de oportunidades" />}
    </>
  );
}
