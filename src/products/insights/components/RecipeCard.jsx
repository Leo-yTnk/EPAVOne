import { memo } from 'preact/compat';
import { Button, Card } from '../../../design-system/components/index.js';
import { CatalogImage } from './CatalogImage.jsx';

export const RecipeCard = memo(function RecipeCard({ recipe, onOpen, compact = false }) {
  const metadata = [
    recipe.prep_time && `${recipe.prep_time} min`,
    recipe.servings && `${recipe.servings} ${Number(recipe.servings) === 1 ? 'porção' : 'porções'}`,
    recipe.difficulty,
  ].filter(Boolean);

  return (
    <Card data-dialog-origin className={`insights-product insights-recipe-card insights-catalog-card${compact ? ' is-compact' : ''}`}>
      <CatalogImage stitched={false} url={recipe.image_url} name={recipe.name} />
      <div className="insights-recipe-copy">
        <h2 className="insights-product-name">{recipe.name}</h2>
        {metadata.length > 0 && <p className="insights-muted insights-recipe-meta">{metadata.join(' | ')}</p>}
        <Button
          variant="primary"
          size="sm"
          className="insights-card-action"
          onClick={() => onOpen(recipe)}
          aria-label={`Ver receita de ${recipe.name}`}
        >
          Ver receita
        </Button>
      </div>
    </Card>
  );
});
