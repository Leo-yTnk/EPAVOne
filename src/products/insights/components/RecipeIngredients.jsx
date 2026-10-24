import { Button } from '../../../design-system/components/index.js';
import { CatalogImage } from './CatalogImage.jsx';

export function RecipeIngredients({ ingredients, onOpenProduct }) {
  return (
    <ul className="recipe-product-list" aria-label="Produtos da receita">
      {ingredients.map((item) => (
        <li key={item.id} className="recipe-product-row" data-dialog-origin>
          <CatalogImage
            compactFallback
            stitched={false}
            url={item.product?.image_url}
            name={item.product?.name || 'Ingrediente indisponível'}
          />
          <div className="recipe-product-copy">
            <strong>{item.product?.name || 'Ingrediente indisponível'}</strong>
            <div className="recipe-product-actions">
              <span className="insights-muted">
                {item.quantity} {item.product?.unit}
              </span>
              {item.product?.id && onOpenProduct && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenProduct(item.product)}
                  aria-label={`Ver produto ${item.product.name}`}
                >
                  Ver produto →
                </Button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
