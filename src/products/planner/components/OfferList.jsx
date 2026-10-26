import { useWeeklyOrder } from '../../../shared/services/useWeeklyOrder.js';
import { matchText } from '../../../shared/services/orderMatching.js';
import { today } from '../models/planner.js';
import { Badge, Button, EmptyState, Heading } from '../../../design-system/components/index.js';
import { recommendations } from '../models/planner.js';
import { commercialContext, insightsProductLink } from '../../../shared/services/commercialContext.js';
export function OfferList({ customer, state, returnTo, weekId }) {
  const { template } = useWeeklyOrder();
  const current = template && template.period.start <= today() && template.period.end >= today();
  const offers = recommendations(customer, state.offers).map((offer) => ({
    ...offer,
    weekly: current
      ? template.products.filter(
          (item) => matchText(item.name).includes(matchText(offer.query)) && Number.isFinite(item.price) && item.price > 0
        )
      : null
  }));
  function open(offer) {
    commercialContext.begin({ customerId: customer.id, customerName: customer.name, weekId, returnTo, query: offer.query });
  }
  return (
    <div className="planner-offers">
      <Button as="a" size="sm" variant="ghost" href="#/writer">
        {current ? `Pedido vigente: ${template.filename}` : 'Carregar pedido atualizado'}
      </Button>
      {!offers.length && (
        <EmptyState
          title="Conheça as preferências primeiro"
          description="Nenhuma sugestão compatível encontrada. Atualize o perfil; restrições nunca são ignoradas."
        />
      )}
      {offers.map((offer) => (
        <div key={offer.id} className="planner-offer">
          <div>
            <Badge>{offer.kind === 'principal' ? 'Principal' : 'Complemento'}</Badge>
            <Heading level={5}>{offer.title}</Heading>
            <p className="planner-muted">
              Buscar {offer.query} · {offer.reason}
            </p>
            <p className="planner-muted">
              {offer.weekly
                ? `${offer.weekly.length} opção(ões) no Excel vigente. ${offer.weekly
                    .slice(0, 2)
                    .map((item) => item.name)
                    .join(' · ')}`
                : 'Carregue o Excel atualizado no Writer para cruzar as sugestões com os produtos da semana.'}
            </p>
          </div>
          <Button as="a" size="sm" variant="secondary" href={insightsProductLink(offer.query)} onClick={() => open(offer)}>
            Consultar no Insights
          </Button>
        </div>
      ))}
    </div>
  );
}
