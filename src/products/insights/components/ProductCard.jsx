import { Badge, Button, Card } from '../../../design-system/components/index.js';
import { CatalogImage } from './CatalogImage.jsx';
import { ProductPrice } from './ProductPrice.jsx';

export function ProductCard({ product, onOpen }) {
  return (
    <Card data-dialog-origin className="insights-product insights-product-card insights-catalog-card">
      <CatalogImage stitched={false} url={product.image_url} name={product.name} />
      <div className="insights-product-copy">
        <Badge>{product.category?.name || 'Outros produtos'}</Badge>
        <h2 className="insights-product-name">{product.name}</h2>
        <ProductPrice product={product} />
        <Button variant="ghost" size="sm" onClick={() => onOpen(product)} aria-label={`Ver detalhes de ${product.name}`}>
          Ver detalhes <span aria-hidden="true">↗</span>
        </Button>
      </div>
    </Card>
  );
}
