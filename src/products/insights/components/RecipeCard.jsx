import { memo } from 'preact/compat';
import { Badge, Button, Card, Icon } from '../../../design-system/components/index.js';
import { CatalogImage } from './CatalogImage.jsx';

export const RecipeCard = memo(function RecipeCard({ recipe, onOpen, compact = false }) {
  return (
    <Card data-dialog-origin className={`insights-product insights-recipe-card insights-catalog-card${compact ? ' is-compact' : ''}`}>
      <CatalogImage stitched={false} url={recipe.image_url} name={recipe.name} />
      <div className="insights-recipe-copy">
        {!compact && <Badge>{recipe.category?.name || 'Receita Swift'}</Badge>}
        <h2 className="insights-product-name">{recipe.name}</h2>
        <p className="insights-muted insights-recipe-meta">
          {recipe.prep_time && (
            <span>
              <Icon name="clock" /> {recipe.prep_time} min
            </span>
          )}
          {recipe.servings && <span>{recipe.servings} porções</span>}
          {!compact && recipe.difficulty && <span>{recipe.difficulty}</span>}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="insights-card-action"
          onClick={() => onOpen(recipe)}
          aria-label={`Ver receita de ${recipe.name}`}
        >
          Ver receita <span aria-hidden="true">↗</span>
        </Button>
      </div>
    </Card>
  );
});
