import { Dialog, ErrorState, Spinner } from '../../../../design-system/components/index.js';
import { creationService } from '../services/creationService.js';
import { useCreationResource } from '../hooks/useCreationResource.js';
export function SharedRecipeDialog({ recipe, onClose }) {
  const resource = useCreationResource(() => creationService.detail('recipes', recipe), recipe.id);
  const detail = resource.data;
  return (
    <Dialog open size="lg" title={recipe.name} onClose={onClose}>
      {resource.loading ? (
        <Spinner />
      ) : resource.error ? (
        <ErrorState description={resource.error} onAction={resource.reload} />
      ) : (
        <div className="creation-fields">
          <p>
            {detail.recipe.prep_time} minutos · {detail.recipe.servings} porções · {detail.recipe.difficulty}
          </p>
          <h3>Ingredientes</h3>
          <ul>
            {detail.ingredients.map((ingredient) => (
              <li key={ingredient.id}>
                {ingredient.quantity} {ingredient.product?.unit} · {ingredient.product?.name || 'Produto indisponível'}
              </li>
            ))}
          </ul>
          <h3>Modo de preparo</h3>
          <ol>
            {(detail.recipe.instructions || []).map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          {['extras', 'tips'].map(
            (field) =>
              detail.recipe[field]?.length > 0 && (
                <section key={field}>
                  <h3>{field === 'extras' ? 'Ingredientes extras' : 'Dicas'}</h3>
                  <ul>
                    {detail.recipe[field].map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                </section>
              )
          )}
        </div>
      )}
    </Dialog>
  );
}
