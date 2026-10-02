import { useMemo, useState } from 'preact/hooks';
import { Button, Checkbox, EmptyState, ErrorState, Input, Pagination, Select, Spinner } from '../../../design-system/components/index.js';
import { catalogService } from '../services/catalogService.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { CATALOG_PAGE_SIZE, filterProducts } from '../models/catalog.js';
import { ProductCard } from './ProductCard.jsx';
import { ProductDetails } from './ProductDetails.jsx';

const load = (_id, options) => catalogService.loadCatalog(options);
export function ProductCatalogPage({ initialCategory = '' }) {
  const resource = useCatalogResource(load, 'public');
  const [filters, setFilters] = useState({ query: '', category: initialCategory, promotion: false });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const filtered = useMemo(() => filterProducts(resource.data?.products || [], filters), [resource.data, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / CATALOG_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  function update(patch) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }
  function reset() {
    update({ query: '', category: '', promotion: false });
  }
  if (resource.loading)
    return (
      <div className="insights-loading" role="status">
        <Spinner /> Carregando o catálogo Swift…
      </div>
    );
  if (resource.error)
    return <ErrorState title="Não foi possível carregar os produtos" description={resource.error} onAction={resource.retry} />;
  const options = [
    { value: '', label: 'Todas as categorias' },
    ...resource.data.categories.map((item) => ({ value: item.id, label: item.name }))
  ];
  return (
    <section className="insights-catalog" aria-label="Catálogo de produtos Swift">
      <div className="insights-filters">
        <Input
          id="insights-search"
          label="Buscar produto"
          type="search"
          placeholder="Nome, código ou categoria"
          value={filters.query}
          onInput={(event) => update({ query: event.currentTarget.value })}
        />
        <Select label="Categoria" value={filters.category} options={options} onChange={(category) => update({ category })} searchable />
        <Checkbox
          aria-label="Com preço por quantidade"
          checked={filters.promotion}
          onChange={(event) => update({ promotion: event.currentTarget.checked })}
        >
          Com preço por quantidade
        </Checkbox>
      </div>
      <div className="insights-results">
        <p className="insights-muted" role="status">
          {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
        </p>
        {filtered.length > 0 && (filters.query || filters.category || filters.promotion) && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Limpar filtros
          </Button>
        )}
      </div>
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
        <div className="insights-grid">
          {filtered.slice((currentPage - 1) * CATALOG_PAGE_SIZE, currentPage * CATALOG_PAGE_SIZE).map((product) => (
            <ProductCard key={product.id} product={product} onOpen={setSelected} />
          ))}
        </div>
      )}
      {pageCount > 1 && <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} label="Páginas do catálogo" />}
      {selected && <ProductDetails key={selected.id} product={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
