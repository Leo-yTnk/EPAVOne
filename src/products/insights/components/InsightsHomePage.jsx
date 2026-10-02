import { useState } from 'preact/hooks';
import { Badge, Button, Card, EmptyState, ErrorState, Spinner } from '../../../design-system/components/index.js';
import { catalogService } from '../services/catalogService.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { productPricing } from '../models/catalog.js';
import { recipeSuggestions } from '../models/recipes.js';
import { RecipeCard } from './RecipeCard.jsx';
import { RecipeDialog } from './RecipeDialog.jsx';
import { CatalogImage } from './CatalogImage.jsx';
import { ProductPrice } from './ProductPrice.jsx';
import { ProductDetails } from './ProductDetails.jsx';

export function InsightsHomePage() {
  const resource = useCatalogResource(catalogService.loadHome, 'home');
  const [recipe, setRecipe] = useState(null);
  const [product, setProduct] = useState(null);
  if (resource.loading)
    return (
      <p role="status" className="insights-loading">
        <Spinner /> Preparando suas sugestões…
      </p>
    );
  if (resource.error)
    return <ErrorState title="Não foi possível carregar as sugestões" description={resource.error} onAction={resource.retry} />;
  const { products, recipes, categories } = resource.data;
  const suggestions = recipeSuggestions(recipes);
  const spotlight = suggestions[0];
  const opportunities = products.filter((item) => productPricing(item).promo).slice(0, 2);
  const quickCount = recipes.filter((item) => Number(item.prep_time) > 0 && Number(item.prep_time) <= 30).length;
  return (
    <div className="insights-home">
      <section className="insights-home-hero" aria-labelledby="insights-home-title">
        <div>
          <span className="ds-overline">Seu ponto de partida</span>
          <h1 id="insights-home-title" className="insights-home-title">
            Uma boa venda começa com uma boa ideia.
          </h1>
          <p>Descubra o que sugerir, conecte produtos a receitas e chegue ao atendimento com uma conversa preparada.</p>
          <div className="insights-home-actions">
            <Button as="a" href="#/insights/receitas">
              Encontrar uma receita
            </Button>
            <Button as="a" href="#/insights/produtos" variant="secondary">
              Consultar produtos
            </Button>
          </div>
        </div>
        <div className="insights-home-summary">
          <span className="ds-overline">Para explorar</span>
          <p>
            <strong>{products.length}</strong> produtos no catálogo
          </p>
          <p>
            <strong>{recipes.length}</strong> receitas publicadas
          </p>
          <p>
            <strong>{quickCount}</strong> receitas em até 30 min
          </p>
        </div>
      </section>
      <div className="insights-home-editorial">
        {spotlight ? (
          <Card as="section" className="insights-spotlight" aria-label="Uma ideia para começar">
            <CatalogImage url={spotlight.image_url} name={spotlight.name} />
            <div>
              <Badge>Uma ideia para começar</Badge>
              <h2 className="ds-heading-h3">{spotlight.name}</h2>
              <p className="insights-muted">
                {[spotlight.prep_time && `${spotlight.prep_time} min de preparo`, spotlight.servings && `${spotlight.servings} porções`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p>Use uma sugestão de preparo para mostrar como o produto pode entrar na rotina do cliente.</p>
              <Button onClick={() => setRecipe(spotlight)}>Conhecer a receita</Button>
            </div>
          </Card>
        ) : (
          <EmptyState title="Novas ideias em breve" description="As receitas publicadas aparecerão aqui." />
        )}
        <section className="insights-home-conversation" aria-labelledby="insights-conversation-title">
          <span className="ds-overline">Na conversa com o cliente</span>
          <h2 id="insights-conversation-title" className="ds-heading-h3">
            Comece pela ocasião.
          </h2>
          <ol>
            <li>
              <strong>Entenda a rotina.</strong> É para o dia a dia, um lanche ou uma refeição especial?
            </li>
            <li>
              <strong>Ofereça uma ideia.</strong> Relacione a receita ao que o cliente gosta de preparar.
            </li>
            <li>
              <strong>Confira o pedido.</strong> Valide disponibilidade e preço no formulário da semana.
            </li>
          </ol>
          <Button as="a" href="#/writer" variant="ghost">
            Montar o pedido no Writer →
          </Button>
        </section>
      </div>
      <section className="insights-home-section" aria-labelledby="insights-category-title">
        <div className="insights-section-heading">
          <div>
            <span className="ds-overline">Escolha por onde começar</span>
            <h2 id="insights-category-title" className="ds-heading-h3">
              O que combina com seu cliente?
            </h2>
          </div>
        </div>
        <div className="insights-category-links">
          {categories.map((category) => (
            <Button key={category.id} as="a" href={`#/insights/produtos/categoria/${category.id}`} variant="secondary" size="sm">
              {category.name}
            </Button>
          ))}
        </div>
      </section>
      {suggestions.length > 1 && (
        <section className="insights-home-section" aria-labelledby="insights-inspiration-title">
          <div className="insights-section-heading">
            <div>
              <span className="ds-overline">Mais inspiração</span>
              <h2 id="insights-inspiration-title" className="ds-heading-h3">
                Ideias para levar à conversa
              </h2>
            </div>
            <Button as="a" href="#/insights/receitas" variant="ghost" size="sm">
              Todas as receitas →
            </Button>
          </div>
          <div className="insights-home-recipes">
            {suggestions.slice(1).map((item) => (
              <RecipeCard key={item.id} recipe={item} onOpen={setRecipe} />
            ))}
          </div>
        </section>
      )}
      {opportunities.length > 0 && (
        <section className="insights-home-section" aria-labelledby="insights-opportunity-title">
          <div className="insights-section-heading">
            <div>
              <span className="ds-overline">Para complementar a sugestão</span>
              <h2 id="insights-opportunity-title" className="ds-heading-h3">
                Preços por quantidade
              </h2>
            </div>
            <Button as="a" href="#/insights/produtos" variant="ghost" size="sm">
              Ver produtos →
            </Button>
          </div>
          <div className="insights-home-opportunities">
            {opportunities.map((item) => (
              <Card key={item.id} className="insights-opportunity">
                <div>
                  <h3>{item.name}</h3>
                  <ProductPrice product={item} />
                </div>
                <Button variant="secondary" size="sm" onClick={() => setProduct(item)}>
                  Ver detalhes
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}
      {recipe && <RecipeDialog recipe={recipe} onClose={() => setRecipe(null)} />}
      {product && <ProductDetails product={product} onClose={() => setProduct(null)} />}
    </div>
  );
}
