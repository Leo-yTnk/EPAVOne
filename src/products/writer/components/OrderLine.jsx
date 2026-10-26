import { Badge, Button, Card, Checkbox, Input } from '../../../design-system/components/index.js';
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function OrderLine({ product, line, index, kitEnabled, readOnly, onChange, onRemove }) {
  return (
    <Card padding="compact" className="writer-line">
      <div className="writer-line-details">
        <h3>{line.name}</h3>
        <div className="writer-product-meta">
          {product.code && <span className="writer-muted">Código {product.code}</span>}
          <span className="writer-muted">{money.format(product.price ?? 0)} por unidade</span>
          {product.unit === 'KG' && <Badge>Peso estimado</Badge>}
        </div>
      </div>
      <div className="writer-line-total">
        <span className="writer-muted">Subtotal</span>
        <strong className="writer-price">{money.format((product.price ?? 0) * line.quantity)}</strong>
      </div>
      <div className="writer-line-footer">
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
              label="Quantidade"
              aria-label={`Quantidade de ${line.name}`}
              value={line.quantity || ''}
              onInput={(event) => onChange(line.name, { quantity: Number(event.currentTarget.value) })}
            />
          )}
          {!readOnly && kitEnabled && (
            <div className="writer-line-kit">
              <Checkbox checked={Boolean(line.kit)} onChange={(event) => onChange(line.name, { kit: event.currentTarget.checked })}>
                Kit
              </Checkbox>
            </div>
          )}
        </div>
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={() => onRemove(line.name)} aria-label={`Remover ${line.name}`}>
            Remover
          </Button>
        )}
      </div>
    </Card>
  );
}
