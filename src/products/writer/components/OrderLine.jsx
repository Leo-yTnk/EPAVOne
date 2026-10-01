import { Badge, Button, Card, Checkbox, Input } from '../../../design-system/components/index.js';
import { ProductImage } from './ProductImage.jsx';
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function OrderLine({ product, line, index, kitEnabled, readOnly, onChange, onRemove }) {
  return (
    <Card className="writer-line">
      <ProductImage product={product} />
      <div className="writer-line-details">
        <h3>{line.name}</h3>
        <span className="writer-muted">{money.format(product.price ?? 0)} por unidade</span>
        {product.unit === 'KG' && <Badge>Peso estimado</Badge>}
      </div>
      <div className="writer-line-controls">
        {readOnly ? (
          <p>
            {line.quantity} {line.quantity === 1 ? 'unidade' : 'unidades'}
            {line.kit ? ' · Kit' : ''}
          </p>
        ) : (
          <Input
            id={`writer-qty-${index}`}
            type="number"
            inputMode="numeric"
            min="1"
            max="9999"
            step="1"
            label={`Quantidade de ${line.name}`}
            value={line.quantity || ''}
            onInput={(event) => onChange(line.name, { quantity: Number(event.currentTarget.value) })}
          />
        )}
        {!readOnly && kitEnabled && (
          <Checkbox checked={Boolean(line.kit)} onChange={(event) => onChange(line.name, { kit: event.currentTarget.checked })}>
            Kit
          </Checkbox>
        )}
      </div>
      <div className="writer-line-footer">
        <strong className="writer-price">{money.format((product.price ?? 0) * line.quantity)}</strong>
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={() => onRemove(line.name)} aria-label={`Remover ${line.name}`}>
            Remover
          </Button>
        )}
      </div>
    </Card>
  );
}
