import { Button, Icon } from '../../../design-system/components/index.js';
import { useCatalogResource } from '../hooks/useCatalogResource.js';
import { catalogService } from '../services/catalogService.js';
import { CatalogImage } from './CatalogImage.jsx';

export function SpotlightIngredients({ recipe, onOpenProduct }) {
  const resource = useCatalogResource(catalogService.recipeIngredients, recipe.id);
  const ingredients = (resource.data || []).filter((item) => item.product?.id).slice(0, 3);
  if (resource.loading)
    return (
      <p className="insights-muted" role="status">
        Conectando a receita aos produtos…
      </p>
    );
  if (resource.error)
    return (
      <Button variant="ghost" size="sm" onClick={resource.retry}>
        Carregar produtos da receita
      </Button>
    );
  if (!ingredients.length) return null;
  return (
    <div className="insights-spotlight-ingredients">
      <p className="ds-overline">
        <Icon name="product" /> Da ideia aos produtos
      </p>
      <div>
        {ingredients.map(({ product }) => (
          <div key={product.id} className="insights-spotlight-product" data-dialog-origin>
            <CatalogImage url={product.image_url} name={product.name} compactFallback />
            <Button variant="ghost" size="sm" onClick={() => onOpenProduct(product)} aria-label={`Consultar ${product.name}`}>
              {product.name} <Icon name="next" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
