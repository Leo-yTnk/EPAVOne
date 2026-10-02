import { Button } from '../../../design-system/components/index.js';
import { CatalogImage } from './CatalogImage.jsx';

export function RecipeIngredients({ ingredients, onOpenProduct }) {
  return (
    <ul className="insights-ingredient-list" aria-label="Produtos da receita">
      {ingredients.map((item) => (
        <li key={item.id} className="insights-ingredient">
          <CatalogImage url={item.product?.image_url} name={item.product?.name || 'Ingrediente indisponível'} />
          <div>
            <strong>{item.product?.name || 'Ingrediente indisponível'}</strong>
            <span className="insights-muted">
              {item.quantity} {item.product?.unit}
            </span>
            {item.product?.id && onOpenProduct && (
              <Button variant="ghost" size="sm" onClick={() => onOpenProduct(item.product)} aria-label={`Ver produto ${item.product.name}`}>
                Ver produto →
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
