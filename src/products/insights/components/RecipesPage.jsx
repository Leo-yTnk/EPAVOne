import { usePerformanceMode } from '../../../design-system/behaviors/performanceMode.js';
import { useContentMotion } from '../../../design-system/behaviors/useContentMotion.js';
import { CatalogChoices } from './CatalogChoices.jsx';
import { CatalogLoading } from './CatalogLoading.jsx';
import { orderedCatalogItems } from '../models/sections.js';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  ModalPresence,
  DeferredItem,
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
import { filterRecipes } from '../models/recipes.js';
import { RecipeCard } from './RecipeCard.jsx';
import { RecipeDialog } from './RecipeDialog.jsx';
import { PersonalRecipesSection } from './PersonalRecipesSection.jsx';

export function RecipesPage({ initialSection = '', initialRecipeId = '', ownerId }) {
  const mode = usePerformanceMode();
  const resource = useCatalogResource(catalogService.recipes, 'published');
  const structure = useCatalogResource(catalogService.structure, 'public');
  const [filters, setFilters] = useState({ query: '', category: '', quick: false, section: initialSection });
  const [selected, setSelected] = useState(null);
  const recipes = resource.data || [];
  useEffect(() => {
    if (initialRecipeId && resource.data) setSelected(resource.data.find((recipe) => recipe.id === initialRecipeId) || null);
  }, [initialRecipeId, resource.data]);
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
  const resultsRef = useRef(null);
  const resultKey = JSON.stringify([resource.loading, Boolean(resource.error), ordered.map((item) => item.id)]);
  useContentMotion(resultsRef, resultKey, 0, 'y');
  function update(patch) {
    setFilters((current) => ({ ...current, ...patch }));
  }
  function reset() {
    update({ query: '', category: '', quick: false, section: '' });
  }
  return (
    <section className="insights-catalog" aria-label="Catálogo de receitas">
      <Card as="section" className="insights-catalog-tools" aria-label="Explorar receitas">
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
            {ownerId && ' no catálogo público'}
          </p>
          {filtered.length > 0 && (filters.query || filters.section || filters.category || filters.quick) && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Limpar filtros
            </Button>
          )}
        </div>
      </Card>
      {ownerId && <PersonalRecipesSection key={ownerId} ownerId={ownerId} filters={filters} />}
      <div ref={resultsRef} className="insights-results-content">
        {resource.loading ? (
          <CatalogLoading label="Carregando receitas…" />
        ) : resource.error ? (
          <ErrorState title="Não foi possível carregar as receitas" description={resource.error} onAction={resource.retry} />
        ) : !filtered.length ? (
          <EmptyState
            title={recipes.length ? 'Nenhuma receita encontrada' : 'Ainda não há receitas publicadas'}
            description={
              recipes.length
                ? 'Tente outra busca ou ajuste os filtros.'
                : 'As receitas aparecerão aqui quando forem publicadas no catálogo.'
            }
            actionLabel={recipes.length ? 'Limpar filtros' : undefined}
            onAction={reset}
          />
        ) : (
          <div className="insights-recipes-collection" aria-label="Todas as receitas encontradas">
            {ordered.map((item) =>
              mode !== 'fabulous' && ordered.length > 24 ? (
                <DeferredItem key={item.id} label={item.name} margin={mode === 'performance' ? 120 : 600}>
                  {() => <RecipeCard recipe={item} onOpen={setSelected} />}
                </DeferredItem>
              ) : (
                <RecipeCard key={item.id} recipe={item} onOpen={setSelected} />
              )
            )}
          </div>
        )}
      </div>
      <ModalPresence>{selected && <RecipeDialog key={selected.id} recipe={selected} onClose={() => setSelected(null)} />}</ModalPresence>
    </section>
  );
}
