import { Badge, Button, Card } from '../../../design-system/components/index.js';
import { ProductImage } from './ProductImage.jsx';
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function ProductTile({ product, quantity, onAdd }) {
  return (
    <Card className="writer-product">
      <ProductImage product={product} />
      <h3>{product.name}</h3>
      <div className="writer-product-meta">
        {product.unit === 'KG' && <Badge>Peso estimado</Badge>}
        {quantity > 0 && <span className="writer-muted">{quantity} no carrinho</span>}
      </div>
      <strong className="writer-price">{product.price === null ? 'Preço indisponível' : money.format(product.price)}</strong>
      <Button variant="secondary" disabled={product.price === null || product.price <= 0} onClick={onAdd}>
        {quantity ? 'Adicionar mais' : 'Adicionar ao pedido'}
      </Button>
    </Card>
  );
}
