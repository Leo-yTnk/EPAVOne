import { useContentMotion } from '../../../design-system/behaviors/useContentMotion.js';
import { useMemo, useRef, useState } from 'preact/hooks';
import { ModalPresence, Button, EmptyState, ErrorState, Input, PageHeader } from '../../../design-system/components/index.js';
import { CatalogLoading } from './CatalogLoading.jsx';
import { CatalogSections } from './CatalogSections.jsx';
import { ProductCard } from './ProductCard.jsx';
import { RecipeCard } from './RecipeCard.jsx';
import { RecipeDialog } from './RecipeDialog.jsx';
import { ProductDetails } from './ProductDetails.jsx';
import { catalogService } from '../services/catalogService.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { discoverySections } from '../models/discovery.js';
import '../home.css';

export function InsightsHomePage() {
  const resource = useCatalogResource(catalogService.loadHome, 'home');
  const structure = useCatalogResource(catalogService.structure, 'public');
  const [recipe, setRecipe] = useState(null);
  const [product, setProduct] = useState(null);
  const [query, setQuery] = useState('');
  const groups = useMemo(
    () => discoverySections({ ...resource.data, structure: structure.data, query }),
    [resource.data, structure.data, query]
  );
  const resultsRef = useRef(null);
  useContentMotion(
    resultsRef,
    JSON.stringify([resource.loading, Boolean(resource.error), groups.map((group) => [group.id, group.items.map((item) => item.id)])]),
    0,
    'y'
  );
  const categories = (resource.data?.categories || []).filter((category) =>
    resource.data.products.some((item) => item.category_id === category.id)
  );
  return (
    <div className="insights-home insights-discovery">
      <PageHeader
        product="insights"
        title="O que vamos preparar?"
        actions={
          <nav aria-label="Explorar o Insights" className="insights-discovery-nav">
            <Button as="a" href="#/insights/receitas" variant="secondary" size="sm">
              Todas as receitas
            </Button>
            <Button as="a" href="#/insights/produtos" variant="secondary" size="sm">
              Consultar produtos
            </Button>
          </nav>
        }
      >
        <Input
          label="Buscar no Insights"
          type="search"
          placeholder="Uma receita, um produto ou uma categoria"
          value={query}
          onInput={(event) => setQuery(event.currentTarget.value)}
        />
        {categories.length > 0 && (
          <nav className="insights-discovery-categories" aria-label="Categorias de produtos">
            {categories.map((category) => (
              <Button key={category.id} as="a" href={`#/insights/produtos/categoria/${category.id}`} variant="ghost" size="sm">
                {category.name}
              </Button>
            ))}
          </nav>
        )}
      </PageHeader>
      <div ref={resultsRef} className="insights-results-content">
        {resource.loading ? (
          <CatalogLoading label="Preparando suas sugestões…" />
        ) : resource.error ? (
          <ErrorState title="Não foi possível carregar as sugestões" description={resource.error} onAction={resource.retry} />
        ) : (
          <>
            {structure.error && (
              <ErrorState
                title="Seções indisponíveis"
                description="As categorias e sugestões continuam disponíveis."
                onAction={structure.retry}
              />
            )}
            {groups.length ? (
              <CatalogSections
                index={false}
                groups={groups}
                renderItem={(item) =>
                  item.catalogKind === 'recipes' ? (
                    <RecipeCard key={`recipe-${item.id}`} recipe={item} onOpen={setRecipe} />
                  ) : (
                    <ProductCard key={`product-${item.id}`} product={item} onOpen={setProduct} />
                  )
                }
              />
            ) : (
              <EmptyState
                title={query ? 'Nenhum resultado encontrado' : 'Novas ideias em breve'}
                description={query ? 'Tente outro nome ou categoria.' : 'As receitas e produtos publicados aparecerão aqui.'}
                actionLabel={query ? 'Limpar busca' : undefined}
                onAction={query ? () => setQuery('') : undefined}
              />
            )}
          </>
        )}
      </div>
      <Button as="a" href="#/writer" variant="ghost" size="sm" className="insights-discovery-writer">
        Montar pedido →
      </Button>
      <ModalPresence>{recipe && <RecipeDialog recipe={recipe} onClose={() => setRecipe(null)} />}</ModalPresence>
      <ModalPresence>{product && <ProductDetails product={product} onClose={() => setProduct(null)} />}</ModalPresence>
    </div>
  );
}
