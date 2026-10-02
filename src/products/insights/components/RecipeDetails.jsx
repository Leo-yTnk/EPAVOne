import { ErrorState, Spinner } from '../../../design-system/components/index.js';
import { catalogService } from '../services/catalogService.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { RecipeIngredients } from './RecipeIngredients.jsx';
import { CatalogImage } from './CatalogImage.jsx';

export function RecipeDetails({ recipe, onOpenProduct }) {
  const resource = useCatalogResource(catalogService.recipeIngredients, recipe.id);
  const steps = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : String(recipe.instructions || '')
        .split(/\n+/)
        .filter(Boolean);
  return (
    <section className="insights-recipe" aria-label={recipe.name}>
      <div className="insights-recipe-overview">
        <CatalogImage url={recipe.image_url} name={recipe.name} />
        <p className="insights-muted">
          {[recipe.prep_time && `${recipe.prep_time} min de preparo`, recipe.servings && `${recipe.servings} porções`, recipe.difficulty]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <div className="insights-recipe-body">
        <h3>Ingredientes</h3>
        {resource.loading ? (
          <p role="status">
            <Spinner /> Carregando ingredientes…
          </p>
        ) : resource.error ? (
          <ErrorState title="Ingredientes indisponíveis" description={resource.error} onAction={resource.retry} />
        ) : resource.data.length ? (
          <RecipeIngredients ingredients={resource.data} onOpenProduct={onOpenProduct} />
        ) : (
          <p>Não há ingredientes cadastrados.</p>
        )}
        {recipe.extras?.length > 0 && (
          <>
            <h3>Outros ingredientes</h3>
            <ul>
              {recipe.extras.map((extra, index) => (
                <li key={index}>{extra}</li>
              ))}
            </ul>
          </>
        )}
        <h3>Modo de preparo</h3>
        {steps.length ? (
          <ol>
            {steps.map((step, index) => (
              <li key={index}>{typeof step === 'string' ? step : step.text || step.description || ''}</li>
            ))}
          </ol>
        ) : (
          <p>Modo de preparo não cadastrado.</p>
        )}
        {recipe.tips && <p className="insights-recipe-tips">{Array.isArray(recipe.tips) ? recipe.tips.join('\n') : recipe.tips}</p>}
      </div>
    </section>
  );
}
