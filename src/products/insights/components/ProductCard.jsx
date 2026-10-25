import { memo } from 'preact/compat';
import { Badge, Button, Card } from '../../../design-system/components/index.js';
import { CatalogImage } from './CatalogImage.jsx';
import { ProductPrice } from './ProductPrice.jsx';

export const ProductCard = memo(function ProductCard({ product, onOpen }) {
  return (
    <Card data-dialog-origin className="insights-product insights-product-card insights-catalog-card">
      <CatalogImage stitched={false} fit="contain" url={product.image_url} name={product.name} />
      <div className="insights-product-copy">
        <Badge>{product.category?.name || 'Outros produtos'}</Badge>
        <h2 className="insights-product-name">{product.name}</h2>
        <ProductPrice product={product} />
        <Button
          variant="secondary"
          size="sm"
          className="insights-card-action"
          onClick={() => onOpen(product)}
          aria-label={`Ver detalhes de ${product.name}`}
        >
          Ver detalhes <span aria-hidden="true">↗</span>
        </Button>
      </div>
    </Card>
  );
});
