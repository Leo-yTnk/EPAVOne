import { CatalogChoices } from './CatalogChoices.jsx';
import { CatalogLoading } from './CatalogLoading.jsx';
import { CatalogSections } from './CatalogSections.jsx';
import { catalogGroups, orderedCatalogItems } from '../models/sections.js';
import { useMemo, useState } from 'preact/hooks';
import {
  Button,
  Checkbox,
  FilterDisclosure,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  Select
} from '../../../design-system/components/index.js';
import { catalogService } from '../services/catalogService.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { filterRecipes } from '../models/recipes.js';
import { CATALOG_PAGE_SIZE } from '../models/catalog.js';
import { RecipeCard } from './RecipeCard.jsx';
import { RecipeDialog } from './RecipeDialog.jsx';

export function RecipesPage({ initialSection = '' }) {
  const resource = useCatalogResource(catalogService.recipes, 'published');
  const structure = useCatalogResource(catalogService.structure, 'public');
  const [filters, setFilters] = useState({ query: '', category: '', quick: false, section: initialSection });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const recipes = resource.data || [];
  const candidates = useMemo(() => filterRecipes(recipes, filters), [resource.data, filters]);
  const categories = [
    ...new Map(recipes.filter((recipe) => recipe.category).map((recipe) => [recipe.category.id, recipe.category])).values()
  ].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const sectionOptions = (structure.data?.sections || []).filter((section) =>
    (structure.data?.recipes || []).some((link) => link.section_id === section.id)
  );
  const memberIds = new Set(
    (structure.data?.recipes || []).filter((link) => link.section_id === filters.section).map((link) => link.recipe_id)
  );
  const filtered = filters.section && structure.data ? candidates.filter((item) => memberIds.has(item.id)) : candidates;
  const ordered = orderedCatalogItems(filtered, structure.data, 'recipes', 'recipes');
  const pageCount = Math.max(1, Math.ceil(filtered.length / CATALOG_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  function update(patch) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }
  function reset() {
    update({ query: '', category: '', quick: false, section: '' });
  }
  if (resource.loading) return <CatalogLoading label="Carregando receitas…" />;
  if (resource.error)
    return <ErrorState title="Não foi possível carregar as receitas" description={resource.error} onAction={resource.retry} />;
  return (
    <section className="insights-catalog" aria-label="Catálogo de receitas">
      {recipes.length > 0 && (
        <CatalogChoices
          title="Quanto tempo seu cliente tem?"
          icon="clock"
          description="Escolha um ponto de partida e refine pela busca."
          choices={[
            {
              label: 'Todas as receitas',
              count: recipes.length,
              active: !filters.quick && !filters.category,
              onSelect: () => update({ quick: false, category: '' })
            },
            {
              label: 'Preparo até 30 min',
              count: filterRecipes(recipes, { quick: true }).length,
              active: filters.quick,
              onSelect: () => update({ quick: true })
            }
          ]}
        />
      )}
      <div className="insights-filters">
        <Input
          id="insights-recipe-search"
          label="Buscar receita"
          type="search"
          placeholder="Nome ou categoria"
          value={filters.query}
          onInput={(event) => update({ query: event.currentTarget.value })}
        />
        <FilterDisclosure count={Number(Boolean(filters.section)) + Number(Boolean(filters.category)) + Number(filters.quick)}>
          {sectionOptions.length > 0 && (
            <Select
              label="Seção do catálogo"
              value={filters.section}
              options={[{ value: '', label: 'Todas as seções' }, ...sectionOptions.map((item) => ({ value: item.id, label: item.name }))]}
              onChange={(section) => update({ section })}
              searchable
            />
          )}
          <Select
            label="Categoria de receita"
            options={[{ value: '', label: 'Todas as categorias' }, ...categories.map((item) => ({ value: item.id, label: item.name }))]}
            value={filters.category}
            onChange={(category) => update({ category })}
            searchable
          />
          <Checkbox
            aria-label="Até 30 minutos"
            checked={filters.quick}
            onChange={(event) => update({ quick: event.currentTarget.checked })}
          >
            Até 30 minutos
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
          {filtered.length} {filtered.length === 1 ? 'receita encontrada' : 'receitas encontradas'}
        </p>
        {filtered.length > 0 && (filters.query || filters.section || filters.category || filters.quick) && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Limpar filtros
          </Button>
        )}
      </div>
      {!filtered.length ? (
        <EmptyState
          title={recipes.length ? 'Nenhuma receita encontrada' : 'Ainda não há receitas publicadas'}
          description={
            recipes.length ? 'Tente outra busca ou ajuste os filtros.' : 'As receitas aparecerão aqui quando forem publicadas no catálogo.'
          }
          actionLabel={recipes.length ? 'Limpar filtros' : undefined}
          onAction={reset}
        />
      ) : (
        <CatalogSections
          groups={catalogGroups(
            ordered.slice((currentPage - 1) * CATALOG_PAGE_SIZE, currentPage * CATALOG_PAGE_SIZE),
            structure.data,
            'recipes',
            'recipes'
          )}
          renderItem={(item) => <RecipeCard key={item.id} recipe={item} onOpen={setSelected} />}
        />
      )}
      {pageCount > 1 && <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} label="Páginas de receitas" />}
      {selected && <RecipeDialog key={selected.id} recipe={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
