import { Badge, Button, EmptyState, Heading } from '../../../design-system/components/index.js';
import { recommendations } from '../models/planner.js';
import { commercialContext, insightsProductLink } from '../../../shared/services/commercialContext.js';
export function OfferList({ customer, state, returnTo, weekId }) {
  const offers = recommendations(customer, state.offers);
  function open(offer) {
    commercialContext.begin({ customerId: customer.id, customerName: customer.name, weekId, returnTo, query: offer.query });
  }
  return (
    <div className="planner-offers">
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
          </div>
          <Button as="a" size="sm" variant="secondary" href={insightsProductLink(offer.query)} onClick={() => open(offer)}>
            Consultar no Insights
          </Button>
        </div>
      ))}
    </div>
  );
}
