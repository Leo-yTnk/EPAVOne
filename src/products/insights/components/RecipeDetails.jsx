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
  const facts = [
    recipe.prep_time && { label: 'Preparo', value: `${recipe.prep_time} min` },
    recipe.servings && { label: 'Rendimento', value: `${recipe.servings} porções` },
    recipe.difficulty && { label: 'Dificuldade', value: recipe.difficulty }
  ].filter(Boolean);
  return (
    <section className="insights-recipe" aria-label={recipe.name}>
      <div className="insights-recipe-overview">
        <CatalogImage url={recipe.image_url} name={recipe.name} />
        {facts.length > 0 && (
          <dl className="insights-recipe-facts" aria-label="Informações da receita">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="insights-recipe-body">
        <section className="insights-detail-section" aria-label="Ingredientes">
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
              <ul className="insights-recipe-extras">
                {recipe.extras.map((extra, index) => (
                  <li key={index}>{extra}</li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="insights-detail-section" aria-label="Modo de preparo">
          <h3>Modo de preparo</h3>
          {steps.length ? (
            <ol className="insights-recipe-steps">
              {steps.map((step, index) => (
                <li key={index}>{typeof step === 'string' ? step : step.text || step.description || ''}</li>
              ))}
            </ol>
          ) : (
            <p>Modo de preparo não cadastrado.</p>
          )}
          {recipe.tips && (
            <div className="insights-detail-section">
              <h3>Dicas de preparo</h3>
              <p className="insights-recipe-tips">{Array.isArray(recipe.tips) ? recipe.tips.join('\n') : recipe.tips}</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
