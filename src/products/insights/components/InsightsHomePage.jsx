import { CatalogSections } from './CatalogSections.jsx';
import { catalogGroups } from '../models/sections.js';
import { ProductCard } from './ProductCard.jsx';
import { useState } from 'preact/hooks';
import { Badge, Button, EmptyState, ErrorState, Heading, Spinner, Text } from '../../../design-system/components/index.js';
import { catalogService } from '../services/catalogService.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { productPricing } from '../models/catalog.js';
import { recipeSuggestions } from '../models/recipes.js';
import { RecipeCard } from './RecipeCard.jsx';
import { RecipeDialog } from './RecipeDialog.jsx';
import { CatalogImage } from './CatalogImage.jsx';
import { ProductPrice } from './ProductPrice.jsx';
import { ProductDetails } from './ProductDetails.jsx';
import '../home.css';

export function InsightsHomePage() {
  const resource = useCatalogResource(catalogService.loadHome, 'home');
  const structure = useCatalogResource(catalogService.structure, 'public');
  const [recipe, setRecipe] = useState(null);
  const [product, setProduct] = useState(null);
  const { products = [], recipes = [], categories = [] } = resource.data || {};
  const suggestions = recipeSuggestions(recipes, 5);
  const homeGroups = new Map();
  for (const kind of ['recipes', 'products']) {
    for (const group of catalogGroups(kind === 'recipes' ? recipes : products, structure.data, 'home', kind)) {
      if (group.id === 'other') continue;
      const previous = homeGroups.get(group.id);
      homeGroups.set(group.id, {
        ...group,
        items: [...(previous?.items || []), ...group.items.map((item) => ({ ...item, catalogKind: kind }))]
      });
    }
  }
  const configuredHome = [...homeGroups.values()].sort((a, b) => {
    const sections = structure.data?.sections || [];
    return sections.findIndex((item) => item.id === a.id) - sections.findIndex((item) => item.id === b.id);
  });
  const spotlight = suggestions[0];
  const opportunities = products.filter((item) => productPricing(item).promo).slice(0, 4);
  const ready = !resource.loading && !resource.error && resource.data;

  return (
    <div className="insights-home insights-discovery">
      <section className="insights-discovery-hero" aria-labelledby="insights-home-title">
        <div className="insights-discovery-copy">
          <span className="ds-overline">Ideias para o próximo atendimento</span>
          <Heading as="h1" id="insights-home-title" className="insights-home-title">
            Uma boa venda começa com uma boa ideia.
          </Heading>
          <Text>Da receita aos ingredientes: encontre uma sugestão que combine com o que seu cliente quer preparar.</Text>
          <div className="insights-home-actions">
            <Button as="a" href="#/insights/receitas" size="sm">
              Encontrar uma receita
            </Button>
            <Button as="a" href="#/insights/produtos" variant="secondary" size="sm">
              Consultar produtos
            </Button>
          </div>
          {ready && (
            <p className="insights-home-counts">
              {products.length} produtos · {recipes.length} receitas publicadas
            </p>
          )}
        </div>
        {ready && spotlight && (
          <section className="insights-spotlight" aria-label="Uma ideia para começar">
            <CatalogImage url={spotlight.image_url} name={spotlight.name} />
            <div>
              <Badge>Uma ideia para começar</Badge>
              <Heading as="h2" level={3}>
                {spotlight.name}
              </Heading>
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
        )}
      </section>
      {resource.loading && (
        <p role="status" className="insights-loading">
          <Spinner /> Preparando suas sugestões…
        </p>
      )}
      {resource.error && (
        <ErrorState title="Não foi possível carregar as sugestões" description={resource.error} onAction={resource.retry} />
      )}
      {ready && (
        <>
          {!spotlight && <EmptyState title="Novas ideias em breve" description="As receitas publicadas aparecerão aqui." />}
          <div className="insights-home-overview" aria-label="Explore o Insights">
            <div>
              <strong>{recipes.length}</strong>
              <span>receitas para inspirar</span>
            </div>
            <div>
              <strong>{products.length}</strong>
              <span>produtos para consultar</span>
            </div>
            <div>
              <strong>{categories.length}</strong>
              <span>categorias para explorar</span>
            </div>
            <Button as="a" href="#/insights/criacao" variant="secondary" size="sm">
              Sua biblioteca e criação →
            </Button>
          </div>
          {structure.error && (
            <ErrorState title="Seções indisponíveis" description="As sugestões continuam disponíveis." onAction={structure.retry} />
          )}
          {configuredHome.length > 0 && (
            <CatalogSections
              groups={configuredHome.map((group) => ({
                ...group,
                total: group.items.length,
                items: group.items.slice(0, 3),
                href: `#/insights/${group.items[0]?.catalogKind === 'products' ? 'produtos' : 'receitas'}/secao/${group.id}`
              }))}
              renderItem={(item) =>
                item.catalogKind === 'recipes' ? (
                  <RecipeCard key={`recipe-${item.id}`} recipe={item} onOpen={setRecipe} />
                ) : (
                  <ProductCard key={`product-${item.id}`} product={item} onOpen={setProduct} />
                )
              }
            />
          )}
          <div className="insights-discovery-body">
            <div className="insights-home-main">
              {suggestions.length > 1 && (
                <section className="insights-home-section" aria-labelledby="insights-inspiration-title">
                  <div className="insights-section-heading">
                    <Heading as="h2" id="insights-inspiration-title" level={4}>
                      Mais ideias para o atendimento
                    </Heading>
                    <Button as="a" href="#/insights/receitas" variant="ghost" size="sm">
                      Todas as receitas →
                    </Button>
                  </div>
                  <div className="insights-home-recipes">
                    {suggestions.slice(1, 5).map((item) => (
                      <RecipeCard key={item.id} recipe={item} onOpen={setRecipe} />
                    ))}
                  </div>
                </section>
              )}
              {opportunities.length > 0 && (
                <section className="insights-home-section" aria-labelledby="insights-opportunity-title">
                  <div className="insights-section-heading">
                    <Heading as="h2" id="insights-opportunity-title" level={4}>
                      Preços por quantidade
                    </Heading>
                    <Button as="a" href="#/insights/produtos" variant="ghost" size="sm">
                      Ver produtos →
                    </Button>
                  </div>
                  <div className="insights-home-opportunities">
                    {opportunities.map((item) => (
                      <article key={item.id} className="insights-opportunity">
                        <CatalogImage url={item.image_url} name={item.name} />
                        <div>
                          <Heading as="h3" level={5}>
                            {item.name}
                          </Heading>
                          <ProductPrice product={item} />
                          <Button variant="ghost" size="sm" onClick={() => setProduct(item)}>
                            Ver detalhes
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
            <aside className="insights-home-aside" aria-label="Atalhos para o atendimento">
              {categories.length > 0 && (
                <section className="insights-home-section" aria-labelledby="insights-category-title">
                  <Heading as="h2" id="insights-category-title" level={4}>
                    Explore por categoria
                  </Heading>
                  <div className="insights-category-links">
                    {categories.map((category) => (
                      <Button key={category.id} as="a" href={`#/insights/produtos/categoria/${category.id}`} variant="ghost" size="sm">
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </section>
              )}
              <section className="insights-home-section insights-conversation" aria-labelledby="insights-conversation-title">
                <Heading as="h2" id="insights-conversation-title" level={4}>
                  Comece pela ocasião.
                </Heading>
                <Text size="sm">
                  O cliente quer uma refeição rápida, um almoço em família ou algo especial? Use a receita para orientar sua sugestão.
                </Text>
                <Text size="sm">Confira os produtos e os preços no formulário da semana antes de concluir.</Text>
                <Button as="a" href="#/writer" variant="ghost" size="sm">
                  Montar o pedido no Writer →
                </Button>
              </section>
            </aside>
          </div>
        </>
      )}
      {recipe && <RecipeDialog recipe={recipe} onClose={() => setRecipe(null)} />}
      {product && <ProductDetails product={product} onClose={() => setProduct(null)} />}
    </div>
  );
}
