import { useState } from 'preact/hooks';
import { EmptyState, ErrorState, ModalPresence, SectionHeader } from '../../../design-system/components/index.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { personalRecipesService } from '../services/personalRecipesService.js';
import { filterRecipes } from '../models/recipes.js';
import { CatalogLoading } from './CatalogLoading.jsx';
import { CatalogSection } from './CatalogSection.jsx';
import { RecipeCard } from './RecipeCard.jsx';
import { RecipeDialog } from './RecipeDialog.jsx';

// Mounted with the account ID as key: rows, pending requests and open details
// are discarded together on sign-out or account switch, before the next paint.
export function PersonalRecipesSection({ ownerId, filters = {} }) {
  const resource = useCatalogResource(personalRecipesService.recipes, ownerId);
  const [selected, setSelected] = useState(null);
  const items = filterRecipes(resource.data || [], filters);
  return (
    <section className="insights-personal-recipes" aria-label="Criados por mim">
      <p className="insights-muted">Suas receitas pessoais. Apenas você vê esta seção.</p>
      {resource.loading || resource.error || !items.length ? (
        <>
          <SectionHeader title="Criados por mim" />
          {resource.loading ? (
            <CatalogLoading label="Carregando suas receitas…" />
          ) : resource.error ? (
            <ErrorState title="Suas receitas estão indisponíveis" description={resource.error} onAction={resource.retry} />
          ) : (
            <EmptyState
              title={resource.data?.length ? 'Nenhuma receita pessoal encontrada' : 'Suas criações começam aqui'}
              description={
                resource.data?.length
                  ? 'Ajuste a busca ou os filtros para encontrar suas receitas.'
                  : 'Crie uma receita para encontrá-la aqui e na sua biblioteca.'
              }
            />
          )}
        </>
      ) : (
        <CatalogSection
          group={{ id: 'personal-recipes', name: 'Criados por mim', items }}
          renderItem={(recipe) => <RecipeCard key={recipe.id} recipe={recipe} onOpen={setSelected} />}
        />
      )}
      <ModalPresence>{selected && <RecipeDialog key={selected.id} recipe={selected} onClose={() => setSelected(null)} />}</ModalPresence>
    </section>
  );
}
