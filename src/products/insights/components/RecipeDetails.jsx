import { Card, Divider, Icon, ErrorState, Spinner } from '../../../design-system/components/index.js';
import { catalogService } from '../services/catalogService.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { RecipeIngredients } from './RecipeIngredients.jsx';
import { CatalogImage } from './CatalogImage.jsx';

export function RecipeDetails({ recipe, onOpenProduct, titleId }) {
  const resource = useCatalogResource(catalogService.recipeIngredients, recipe.id);
  const steps = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : String(recipe.instructions || '')
        .split(/\n+/)
        .filter(Boolean);
  const facts = [
    recipe.prep_time && { label: 'Preparo', icon: 'clock', value: `${recipe.prep_time} min` },
    recipe.servings && { label: 'Rendimento', icon: 'recipe', value: `${recipe.servings} porções` },
    recipe.difficulty && { label: 'Dificuldade', icon: 'difficulty', value: recipe.difficulty }
  ].filter(Boolean);
  return (
    <section className="insights-recipe" aria-label={recipe.name}>
      <Card stitched={false} as="div" className="insights-recipe-overview">
        <CatalogImage stitched={false} url={recipe.image_url} name={recipe.name} />
        <div className="insights-recipe-summary">
          <h2 id={titleId} className="insights-recipe-title">
            {recipe.name}
          </h2>
          <Divider className="insights-recipe-title-divider" />
          {facts.length > 0 && (
            <dl className="insights-recipe-facts" aria-label="Informações da receita">
              {facts.map((fact) => (
                <div key={fact.label} className="insights-recipe-fact">
                  <dt>
                    <Icon name={fact.icon} /> {fact.label}
                  </dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Card>
      <div className="insights-recipe-body">
        <Card stitched={false} as="section" className="insights-detail-section insights-recipe-panel" aria-label="Ingredientes">
          <h3>
            <Icon name="product" /> Ingredientes
          </h3>
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
        </Card>
        <Card stitched={false} as="section" className="insights-detail-section insights-recipe-panel" aria-label="Modo de preparo">
          <h3>
            <Icon name="recipe" /> Modo de preparo
          </h3>
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
            <section className="insights-recipe-tip">
              <h3>
                <Icon name="insights" /> Dicas de preparo
              </h3>
              <p className="insights-recipe-tips">{Array.isArray(recipe.tips) ? recipe.tips.join('\n') : recipe.tips}</p>
            </section>
          )}
        </Card>
      </div>
    </section>
  );
}
