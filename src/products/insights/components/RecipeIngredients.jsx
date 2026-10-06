import { Button, Card } from '../../../design-system/components/index.js';
import { CatalogImage } from './CatalogImage.jsx';

export function RecipeIngredients({ ingredients, onOpenProduct }) {
  return (
    <ul className="insights-ingredient-list" aria-label="Produtos da receita">
      {ingredients.map((item) => (
        <Card as="li" key={item.id} className="insights-ingredient" data-dialog-origin>
          <CatalogImage
            compactFallback
            stitched={false}
            url={item.product?.image_url}
            name={item.product?.name || 'Ingrediente indisponível'}
          />
          <div className="insights-ingredient-copy">
            <strong>{item.product?.name || 'Ingrediente indisponível'}</strong>
            <div className="insights-ingredient-footer">
              <span className="insights-muted">
                {item.quantity} {item.product?.unit}
              </span>
              {item.product?.id && onOpenProduct && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenProduct(item.product)}
                  aria-label={`Ver produto ${item.product.name}`}
                >
                  Ver produto →
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </ul>
  );
}
