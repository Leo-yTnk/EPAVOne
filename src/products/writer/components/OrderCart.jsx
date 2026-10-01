import { Alert, Button, Card, Checkbox, Input } from '../../../design-system/components/index.js';
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function OrderCart({ template, lines, onChange, onRemove, errors, busy, onExport, success }) {
  const total = lines.reduce(
    (sum, line) => sum + (template.products.find((item) => item.name === line.name)?.price ?? 0) * line.quantity,
    0
  );
  const files = Math.ceil(lines.length / template.capacity);
  return (
    <Card className="writer-cart">
      <span className="ds-overline">4 · Conferência</span>
      <h2 className="ds-heading-h3">Seu pedido</h2>
      {!lines.length && <p>Adicione produtos pelo catálogo.</p>}
      <ol className="writer-cart-list">
        {lines.map((line, index) => (
          <li key={line.name}>
            <strong>{line.name}</strong>
            <Input
              id={`writer-qty-${index}`}
              type="number"
              inputMode="numeric"
              min="1"
              max="9999"
              step="1"
              label="Quantidade"
              value={line.quantity || ''}
              onInput={(event) => onChange(line.name, { quantity: Number(event.currentTarget.value) })}
            />
            {template.kitOptions.includes('sim') && (
              <Checkbox checked={Boolean(line.kit)} onChange={(event) => onChange(line.name, { kit: event.currentTarget.checked })}>
                Kit
              </Checkbox>
            )}
            <Button variant="ghost" size="sm" onClick={() => onRemove(line.name)}>
              Remover
            </Button>
          </li>
        ))}
      </ol>
      <div className="writer-cart-total">
        <span>Total dos produtos</span>
        <strong>{money.format(total)}</strong>
      </div>
      <p className="writer-muted">
        {lines.length} produtos distintos · {files || 0} {files === 1 ? 'arquivo Excel' : 'arquivos Excel'}. Até 12 produtos por arquivo.
        Frete conforme o formulário, separado deste subtotal.
      </p>
      {files > 1 && (
        <Alert title="Pedido dividido automaticamente">
          Você receberá um ZIP com {files} formulários. A fórmula original do número de pedido será preservada e poderá produzir o mesmo
          número nas partes.
        </Alert>
      )}
      {errors.length > 0 && (
        <div className="writer-validation" role="status">
          <strong>Falta conferir:</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <Button disabled={errors.length > 0 || busy} loading={busy} onClick={onExport}>
        Validar e baixar {files > 1 ? 'pedidos' : 'pedido'}
      </Button>
      {success && (
        <Alert tone="success" title="Arquivos gerados">
          {success}
        </Alert>
      )}
      <p className="writer-muted">Abra os arquivos no Excel para recalcular os campos automáticos e confira antes de enviar ao suporte.</p>
    </Card>
  );
}
