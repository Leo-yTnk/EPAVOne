import { useState } from 'preact/hooks';
import { Badge, Button, EmptyState, ErrorState, Spinner } from '../../../design-system/components/index.js';
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
  return (
    <div className="insights-home">
      <section className="insights-home-hero" aria-labelledby="insights-home-title">
        <div>
          <span className="ds-overline">EPAVInsights</span>
          <h1 id="insights-home-title" className="insights-home-title">
            Uma boa venda começa com uma boa ideia.
          </h1>
          <p>Encontre uma receita, escolha os produtos e prepare sua próxima sugestão.</p>
          <p className="insights-home-counts">
            {products.length} produtos · {recipes.length} receitas publicadas
          </p>
        </div>
        <div className="insights-home-actions">
          <Button as="a" href="#/insights/receitas" size="sm">
            Encontrar uma receita
          </Button>
          <Button as="a" href="#/insights/produtos" variant="secondary" size="sm">
            Consultar produtos
          </Button>
        </div>
      </section>
      <div className="insights-home-columns">
        <div className="insights-home-main">
          <section className="insights-home-section" aria-labelledby="insights-featured-title">
            <h2 id="insights-featured-title" className="ds-heading-h4">
              Em destaque
            </h2>
            {spotlight ? (
              <section className="insights-spotlight" aria-label="Uma ideia para começar">
                <CatalogImage url={spotlight.image_url} name={spotlight.name} />
                <div>
                  <Badge>Uma ideia para começar</Badge>
                  <h3 className="ds-heading-h4">{spotlight.name}</h3>
                  <p className="insights-muted">
                    {[spotlight.prep_time && `${spotlight.prep_time} min`, spotlight.servings && `${spotlight.servings} porções`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <Button size="sm" onClick={() => setRecipe(spotlight)}>
                    Conhecer a receita
                  </Button>
                </div>
              </section>
            ) : (
              <EmptyState title="Novas ideias em breve" description="As receitas publicadas aparecerão aqui." />
            )}
          </section>
          {suggestions.length > 1 && (
            <section className="insights-home-section" aria-labelledby="insights-inspiration-title">
              <div className="insights-section-heading">
                <h2 id="insights-inspiration-title" className="ds-heading-h4">
                  Mais ideias para o atendimento
                </h2>
                <Button as="a" href="#/insights/receitas" variant="ghost" size="sm">
                  Todas as receitas →
                </Button>
              </div>
              <div className="insights-home-recipes">
                {suggestions.slice(1, 3).map((item) => (
                  <RecipeCard key={item.id} recipe={item} onOpen={setRecipe} compact />
                ))}
              </div>
            </section>
          )}
          {opportunities.length > 0 && (
            <section className="insights-home-section" aria-labelledby="insights-opportunity-title">
              <div className="insights-section-heading">
                <h2 id="insights-opportunity-title" className="ds-heading-h4">
                  Preços por quantidade
                </h2>
                <Button as="a" href="#/insights/produtos" variant="ghost" size="sm">
                  Ver produtos →
                </Button>
              </div>
              <div className="insights-home-opportunities">
                {opportunities.map((item) => (
                  <article key={item.id} className="insights-opportunity">
                    <div>
                      <h3>{item.name}</h3>
                      <ProductPrice product={item} />
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setProduct(item)}>
                      Ver detalhes
                    </Button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="insights-home-aside" aria-label="Atalhos para o atendimento">
          <section className="insights-home-section" aria-labelledby="insights-category-title">
            <h2 id="insights-category-title" className="ds-heading-h4">
              Explore por categoria
            </h2>
            <div className="insights-category-links">
              {categories.map((category) => (
                <Button key={category.id} as="a" href={`#/insights/produtos/categoria/${category.id}`} variant="secondary" size="sm">
                  {category.name}
                </Button>
              ))}
            </div>
          </section>
          <section className="insights-home-section" aria-labelledby="insights-conversation-title">
            <h2 id="insights-conversation-title" className="ds-heading-h4">
              Comece pela ocasião.
            </h2>
            <p className="insights-muted">Pergunte o que o cliente quer preparar e use uma receita para orientar a sugestão.</p>
            <p className="insights-muted">Antes de concluir, confira disponibilidade e preço no formulário da semana.</p>
            <Button as="a" href="#/writer" variant="ghost" size="sm">
              Montar o pedido no Writer →
            </Button>
          </section>
        </aside>
      </div>
      {recipe && <RecipeDialog recipe={recipe} onClose={() => setRecipe(null)} />}
      {product && <ProductDetails product={product} onClose={() => setProduct(null)} />}
    </div>
  );
}
