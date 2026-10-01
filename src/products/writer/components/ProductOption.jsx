import { Badge, Button } from '../../../design-system/components/index.js';
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function ProductOption({ product, quantity, onAdd }) {
  const available = Number.isFinite(product.price) && product.price > 0;
  return (
    <div className="writer-product-option">
      <div className="writer-product-description">
        <h3>{product.name}</h3>
        <div className="writer-product-meta">
          {product.code && <span className="writer-muted">Código {product.code}</span>}
          {product.unit === 'KG' && <Badge>Peso estimado</Badge>}
          {quantity > 0 && <span className="writer-muted">{quantity} no carrinho</span>}
        </div>
      </div>
      <strong className="writer-price">{available ? money.format(product.price) : 'Preço indisponível'}</strong>
      <Button variant="secondary" disabled={!available} onClick={() => available && onAdd()}>
        {quantity ? 'Adicionar mais' : 'Adicionar ao pedido'}
      </Button>
    </div>
  );
}
