import { useMemo } from 'preact/hooks';
import { OrderLine } from './OrderLine.jsx';
import { Alert, Button, Card, EmptyState, SectionHeader, SummaryList } from '../../../design-system/components/index.js';
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function OrderCart({ template, lines, onChange, onRemove, errors = [], busy, onExport, success, readOnly = false }) {
  const productsByName = useMemo(() => new Map(template.products.map((product) => [product.name, product])), [template.products]);
  const total = lines.reduce((sum, line) => sum + (productsByName.get(line.name)?.price ?? 0) * line.quantity, 0);
  const files = Math.ceil(lines.length / template.capacity);
  return (
    <section className={`writer-cart${readOnly ? ' is-readonly' : ''}`} aria-label="Seu carrinho">
      <div className="writer-cart-products">
        {!lines.length && (
          <EmptyState
            title="Seu carrinho está vazio"
            description="Use Adicionar produto para escolher entre as opções do pedido semanal."
          />
        )}
        <ol className="writer-cart-list">
          {lines.map((line, index) => (
            <li key={line.name}>
              <OrderLine
                product={productsByName.get(line.name) ?? { name: line.name, price: null }}
                line={line}
                index={index}
                kitEnabled={template.kitOptions.includes('sim')}
                readOnly={readOnly}
                onChange={onChange}
                onRemove={onRemove}
              />
            </li>
          ))}
        </ol>
      </div>
      <Card className="writer-cart-summary">
        <SectionHeader eyebrow="Resumo do pedido" title="Seu carrinho" />
        <div className="writer-cart-total">
          <span>Total dos produtos</span>
          <strong>{money.format(total)}</strong>
        </div>
        <SummaryList
          className="writer-cart-metrics"
          items={[
            { label: 'Produtos', value: lines.length },
            { label: 'Unidades', value: lines.reduce((sum, line) => sum + Number(line.quantity), 0) },
            { label: 'Arquivos', value: files || 0 }
          ]}
        />
        <p className="writer-muted writer-cart-note">Até 12 produtos por arquivo. Frete separado, conforme o formulário.</p>
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
        {onExport && (
          <Button disabled={errors.length > 0 || busy} loading={busy} onClick={onExport}>
            Validar e baixar {files > 1 ? 'pedidos' : 'pedido'}
          </Button>
        )}
        {success && (
          <Alert tone="success" title="Arquivos gerados">
            {success}
          </Alert>
        )}
        {onExport && (
          <p className="writer-muted">
            Abra os arquivos no Excel para recalcular os campos automáticos e confira antes de enviar ao suporte.
          </p>
        )}
      </Card>
    </section>
  );
}
