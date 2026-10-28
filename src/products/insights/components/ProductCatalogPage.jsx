import { useDebouncedValue } from '../../../design-system/behaviors/useDebouncedValue.js';
import { usePerformanceMode } from '../../../design-system/behaviors/performanceMode.js';
import { useContentMotion } from '../../../design-system/behaviors/useContentMotion.js';
import { CatalogChoices } from './CatalogChoices.jsx';
import { CatalogLoading } from './CatalogLoading.jsx';
import { CatalogSections } from './CatalogSections.jsx';
import { browseCatalogGroups, orderedCatalogItems } from '../models/sections.js';
import { useCallback, useMemo, useRef, useState } from 'preact/hooks';
import {
  ModalPresence,
  Button,
  Card,
  Checkbox,
  FilterDisclosure,
  EmptyState,
  ErrorState,
  Input,
  Select
} from '../../../design-system/components/index.js';
import { catalogService } from '../services/catalogService.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { filterProducts, productPricing, productSearchIndex } from '../models/catalog.js';
import { ProductCard } from './ProductCard.jsx';
import { ProductDetails } from './ProductDetails.jsx';

const load = catalogService.loadCatalog;
export function ProductCatalogPage({ initialCategory = '', initialSection = '', initialQuery = '' }) {
  const resource = useCatalogResource(load, 'public');
  const structure = useCatalogResource(catalogService.structure, 'public');
  const [filters, setFilters] = useState({ query: initialQuery, category: initialCategory, promotion: false, section: initialSection });
  const [selected, setSelected] = useState(null);
  const mode = usePerformanceMode();
  const query = useDebouncedValue(filters.query, mode === 'fabulous' ? 0 : 150);
  const searchIndex = useMemo(() => productSearchIndex(resource.data?.products || []), [resource.data]);
  const candidates = useMemo(
    () => filterProducts(resource.data?.products || [], { ...filters, query }, searchIndex),
    [resource.data, query, filters.category, filters.promotion, searchIndex]
  );
  const sectionOptions = (structure.data?.sections || []).filter((section) =>
    (structure.data?.products || []).some((link) => link.section_id === section.id)
  );
  const filtered = useMemo(() => {
    if (!filters.section || !structure.data) return candidates;
    const memberIds = new Set(
      (structure.data.products || []).filter((link) => link.section_id === filters.section).map((link) => link.product_id)
    );
    return candidates.filter((item) => memberIds.has(item.id));
  }, [candidates, structure.data, filters.section]);
  const ordered = useMemo(() => orderedCatalogItems(filtered, structure.data, 'products', 'products'), [filtered, structure.data]);
  const groups = useMemo(() => browseCatalogGroups(ordered, structure.data, 'products', 'products'), [ordered, structure.data]);
  const renderProduct = useCallback((item) => <ProductCard key={item.id} product={item} onOpen={setSelected} />, []);
  const resultsRef = useRef(null);
  const resultKey = mode === 'fabulous' ? JSON.stringify([resource.loading, Boolean(resource.error), ordered.map((item) => item.id)]) : '';
  useContentMotion(resultsRef, resultKey, 0, 'y');
  function update(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }
  function reset() {
    update({ query: '', category: '', promotion: false, section: '' });
  }
  if (resource.loading) return <CatalogLoading label="Carregando o catálogo Swift…" />;
  if (resource.error)
    return <ErrorState title="Não foi possível carregar os produtos" description={resource.error} onAction={resource.retry} />;
  const options = [
    { value: '', label: 'Todas as categorias' },
    ...resource.data.categories.map((item) => ({ value: item.id, label: item.name }))
  ];
  return (
    <section className="insights-catalog" aria-label="Catálogo de produtos Swift">
      <Card as="section" className="insights-catalog-tools" aria-label="Explorar produtos">
        {resource.data.products.length > 0 && (
          <CatalogChoices
            title="Encontre uma oportunidade"
            icon="product"
            description="Consulte o preço por quantidade ou explore uma categoria."
            choices={[
              {
                label: 'Todos os produtos',
                count: resource.data.products.length,
                active: !filters.category && !filters.promotion,
                onSelect: () => update({ category: '', promotion: false })
              },
              ...(resource.data.products.some((item) => productPricing(item).promo)
                ? [
                    {
                      label: 'Preço por quantidade',
                      count: resource.data.products.filter((item) => productPricing(item).promo).length,
                      active: filters.promotion,
                      onSelect: () => update({ promotion: !filters.promotion })
                    }
                  ]
                : []),
              ...resource.data.categories
                .filter((category) => resource.data.products.some((item) => item.category_id === category.id))
                .slice(0, 5)
                .map((category) => ({
                  label: category.name,
                  count: resource.data.products.filter((item) => item.category_id === category.id).length,
                  active: filters.category === category.id,
                  onSelect: () => update({ category: filters.category === category.id ? '' : category.id })
                }))
            ]}
          />
        )}
        <div className="insights-filters">
          <Input
            id="insights-search"
            label="Buscar produto"
            type="search"
            placeholder="Nome, código ou categoria"
            value={filters.query}
            onInput={(event) => update({ query: event.currentTarget.value })}
          />
          <FilterDisclosure count={Number(Boolean(filters.section)) + Number(Boolean(filters.category)) + Number(filters.promotion)}>
            {sectionOptions.length > 0 && (
              <Select
                label="Seção do catálogo"
                value={filters.section}
                options={[{ value: '', label: 'Todas as seções' }, ...sectionOptions.map((item) => ({ value: item.id, label: item.name }))]}
                onChange={(section) => update({ section })}
                searchable
              />
            )}
            <Select label="Categoria" value={filters.category} options={options} onChange={(category) => update({ category })} searchable />
            <Checkbox
              aria-label="Com preço por quantidade"
              checked={filters.promotion}
              onChange={(event) => update({ promotion: event.currentTarget.checked })}
            >
              Com preço por quantidade
            </Checkbox>
          </FilterDisclosure>
        </div>
        {structure.error && (
          <ErrorState
            title="Seções indisponíveis"
            description="O catálogo continua disponível. Tente carregar sua organização novamente."
            onAction={structure.retry}
          />
        )}
        <div className="insights-results">
          <p className="insights-muted" role="status">
            {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
          {filtered.length > 0 && (filters.query || filters.section || filters.category || filters.promotion) && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Limpar filtros
            </Button>
          )}
        </div>
      </Card>
      {resource.refreshError && (
        <ErrorState
          title="Não foi possível atualizar os preços"
          description="Exibindo a última consulta deste navegador. Confirme os preços antes do pedido."
          onAction={resource.retry}
        />
      )}
      <div ref={resultsRef} className="insights-results-content" aria-busy={filters.query !== query}>
        {!filtered.length ? (
          <EmptyState
            title={resource.data.products.length ? 'Nenhum produto encontrado' : 'Catálogo vazio'}
            description={
              resource.data.products.length ? 'Tente outro nome ou ajuste os filtros.' : 'Não há produtos públicos ativos no momento.'
            }
            actionLabel={resource.data.products.length ? 'Limpar filtros' : undefined}
            onAction={reset}
          />
        ) : (
          <CatalogSections groups={groups} renderItem={renderProduct} />
        )}
      </div>
      <ModalPresence>{selected && <ProductDetails key={selected.id} product={selected} onClose={() => setSelected(null)} />}</ModalPresence>
    </section>
  );
}
