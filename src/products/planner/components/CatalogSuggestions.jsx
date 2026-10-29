import { useMemo } from 'preact/hooks';
import { Badge, Button, Heading } from '../../../design-system/components/index.js';
import { useIntelligence } from '../hooks/useIntelligence.js';
import { useCommercialContext } from '../../../shared/services/useCommercialContext.js';
import { commercialContext, insightsProductLink } from '../../../shared/services/commercialContext.js';
import { canonicalName } from '../../../shared/services/sales.js';
import { recipeComplements } from '../../../shared/intelligence/catalog.js';
export function CatalogSuggestions({ customer, weekId, returnTo }) {
  const intelligence = useIntelligence();
  const context = useCommercialContext();
  const matches = intelligence?.matches.get(customer.id);
  const linked = context?.customerId === customer.id && context?.weekId === weekId;
  const lines = linked ? context?.summary?.saleDraft?.lines : null;
  const complements = useMemo(() => {
    if (!matches || !lines) return [];
    const selected = intelligence.index.products
      .filter((p) =>
        lines.some((l) => canonicalName(l.name) === canonicalName(p.name) && (!l.code || String(l.code) === String(p.product_code)))
      )
      .map((p) => p.id);
    return recipeComplements(matches, selected).slice(0, 2);
  }, [matches, lines, intelligence?.index]);
  if (!intelligence) return null;
  function begin(query) {
    commercialContext.begin({ customerId: customer.id, customerName: customer.name, weekId, returnTo, query });
  }
  return (
    <div className="planner-offers" aria-label="Sugestões do catálogo real">
      {(intelligence.catalog.loading || intelligence.analyzing) && (
        <p className="planner-muted" role="status">
          Consultando produtos e receitas do catálogo…
        </p>
      )}
      {intelligence.catalog.error && <p className="planner-muted">{intelligence.catalog.error}</p>}
      {matches?.products.slice(0, 3).map((item) => (
        <div key={item.id} className="planner-offer">
          <div>
            <Badge>Produto do catálogo</Badge>
            <Heading level={5}>{item.name}</Heading>
            <p className="planner-muted">{item.reason}</p>
            <p className="planner-muted">{item.availability}</p>
          </div>
          <Button as="a" size="sm" variant="secondary" href={insightsProductLink(item.name)} onClick={() => begin(item.name)}>
            Consultar produto
          </Button>
        </div>
      ))}
      {matches?.recipes.slice(0, 2).map((item) => (
        <div key={item.id} className="planner-offer">
          <div>
            <Badge>Ideia de preparo</Badge>
            <Heading level={5}>{item.name}</Heading>
            <p className="planner-muted">
              {item.reason} {item.limitation}
            </p>
          </div>
          <Button
            as="a"
            size="sm"
            variant="secondary"
            href={`#/insights/receitas/receita/${encodeURIComponent(item.id)}`}
            onClick={() => begin('')}
          >
            Conferir receita
          </Button>
        </div>
      ))}
      {matches?.incompleteRecipes && (
        <p className="planner-muted">
          Os ingredientes das receitas não puderam ser consultados. As sugestões de receitas aguardam essa conferência.
        </p>
      )}
      {!(intelligence.catalog.loading || intelligence.analyzing) && !intelligence.catalog.error && !matches?.products.length && (
        <p className="planner-muted">
          Nenhum produto com categoria reconhecida corresponde às preferências sem contrariar as restrições. Não inferimos interesses das
          observações livres.
        </p>
      )}
      {complements.map((item) => (
        <div key={item.product.id} className="planner-offer">
          <div>
            <Heading level={5}>{item.product.name}</Heading>
            <p className="planner-muted">{item.reason} A disponibilidade ainda precisa ser conferida.</p>
          </div>
          <Button
            as="a"
            href={insightsProductLink(item.product.name)}
            size="sm"
            variant="secondary"
            onClick={() => begin(item.product.name)}
          >
            Conferir complemento
          </Button>
        </div>
      ))}
      {linked && context.orderStatus === 'exported' && (
        <div className="planner-offer">
          <div>
            <strong>Pedido conferido neste atendimento</strong>
            <p className="planner-muted">
              Revise produtos e quantidades no Writer antes de registrar a venda. A exportação não comprova compra.
            </p>
          </div>
          <Button as="a" size="sm" href="#/writer" variant="secondary">
            Revisar pedido no Writer
          </Button>
        </div>
      )}
    </div>
  );
}
