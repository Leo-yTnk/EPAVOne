import { Button, ErrorState, Spinner } from '../../../design-system/components/index.js';
import { catalogService } from '../services/catalogService.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { CatalogImage } from './CatalogImage.jsx';

export function RecipeDetails({ recipe, onBack }) {
  const resource = useCatalogResource(catalogService.recipeIngredients, recipe.id);
  const steps = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : String(recipe.instructions || '')
        .split(/\n+/)
        .filter(Boolean);
  return (
    <section className="insights-recipe" aria-label={recipe.name}>
      <Button variant="ghost" size="sm" onClick={onBack}>
        ← Voltar ao produto
      </Button>
      <h3 className="ds-heading-h3">{recipe.name}</h3>
      <CatalogImage url={recipe.image_url} name={recipe.name} />
      <p className="insights-muted">
        {[recipe.prep_time && `${recipe.prep_time} min`, recipe.servings && `${recipe.servings} porções`, recipe.difficulty]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <h4>Ingredientes</h4>
      {resource.loading ? (
        <p role="status">
          <Spinner /> Carregando ingredientes…
        </p>
      ) : resource.error ? (
        <ErrorState title="Ingredientes indisponíveis" description={resource.error} onAction={resource.retry} />
      ) : resource.data.length ? (
        <ul>
          {resource.data.map((item) => (
            <li key={item.id}>
              {item.quantity} {item.product?.unit} · {item.product?.name || 'Ingrediente indisponível'}
            </li>
          ))}
        </ul>
      ) : (
        <p>Não há ingredientes cadastrados.</p>
      )}
      {recipe.extras?.length > 0 && (
        <>
          <h4>Outros ingredientes</h4>
          <ul>
            {recipe.extras.map((extra, index) => (
              <li key={index}>{extra}</li>
            ))}
          </ul>
        </>
      )}
      <h4>Modo de preparo</h4>
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
    </section>
  );
}
