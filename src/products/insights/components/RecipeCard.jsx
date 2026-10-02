import { Badge, Button, Card } from '../../../design-system/components/index.js';
import { CatalogImage } from './CatalogImage.jsx';

export function RecipeCard({ recipe, onOpen }) {
  return (
    <Card className="insights-product insights-recipe-card">
      <CatalogImage url={recipe.image_url} name={recipe.name} />
      <Badge>{recipe.category?.name || 'Receita Swift'}</Badge>
      <h2 className="insights-product-name">{recipe.name}</h2>
      <p className="insights-muted">
        {[recipe.prep_time && `${recipe.prep_time} min`, recipe.servings && `${recipe.servings} porções`, recipe.difficulty]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <Button variant="secondary" size="sm" onClick={() => onOpen(recipe)} aria-label={`Ver receita de ${recipe.name}`}>
        Ver receita
      </Button>
    </Card>
  );
}
