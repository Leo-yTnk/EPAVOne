import '../recipe-detail.css';
import { Icon, ErrorState, Spinner } from '../../../design-system/components/index.js';
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
    <section className="recipe-detail" aria-label={recipe.name}>
      <header className="recipe-detail-hero">
        <CatalogImage stitched={false} url={recipe.image_url} name={recipe.name} />
        <div className="recipe-detail-summary">
          <span className="ds-overline recipe-detail-eyebrow">Para preparar e compartilhar</span>
          <h2 id={titleId} className="recipe-detail-title">
            {recipe.name}
          </h2>
          {recipe.description && <p className="recipe-detail-description">{recipe.description}</p>}
          {facts.length > 0 && (
            <dl className="recipe-detail-facts" aria-label="Informações da receita">
              {facts.map((fact) => (
                <div key={fact.label} className="recipe-detail-fact">
                  <dt>
                    <Icon name={fact.icon} /> {fact.label}
                  </dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </header>
      <div className="recipe-detail-body">
        <section className="recipe-detail-section recipe-detail-ingredients" aria-label="Ingredientes">
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
              <h4>Outros ingredientes</h4>
              <ul className="recipe-detail-extras">
                {recipe.extras.map((extra, index) => (
                  <li key={index}>{extra}</li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="recipe-detail-section recipe-detail-method" aria-label="Modo de preparo">
          <h3>
            <Icon name="recipe" /> Modo de preparo
          </h3>
          {steps.length ? (
            <ol className="recipe-detail-steps">
              {steps.map((step, index) => (
                <li key={index}>{typeof step === 'string' ? step : step.text || step.description || ''}</li>
              ))}
            </ol>
          ) : (
            <p>Modo de preparo não cadastrado.</p>
          )}
          {recipe.tips && (
            <section className="recipe-detail-tip">
              <h3>
                <Icon name="insights" /> Dicas de preparo
              </h3>
              <p className="recipe-detail-tips">{Array.isArray(recipe.tips) ? recipe.tips.join('\n') : recipe.tips}</p>
            </section>
          )}
        </section>
      </div>
    </section>
  );
}
