import { Badge, Button, Card } from '../../../design-system/components/index.js';
import { CatalogImage } from './CatalogImage.jsx';
import { ProductPrice } from './ProductPrice.jsx';

export function ProductCard({ product, onOpen }) {
  return (
    <Card className="insights-product">
      <CatalogImage url={product.image_url} name={product.name} />
      <Badge>{product.category?.name || 'Outros produtos'}</Badge>
      <h2 className="insights-product-name">{product.name}</h2>
      <ProductPrice product={product} />
      <Button variant="secondary" size="sm" onClick={() => onOpen(product)} aria-label={`Ver detalhes de ${product.name}`}>
        Ver detalhes e receitas
      </Button>
    </Card>
  );
}
