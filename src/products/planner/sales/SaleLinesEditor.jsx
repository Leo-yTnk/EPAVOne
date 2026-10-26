import { Button, Checkbox, FieldGrid, Input, SectionHeader } from '../../../design-system/components/index.js';
export function SaleLinesEditor({ lines, onChange }) {
  function change(index, patch) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }
  return (
    <section className="planner-sale-lines">
      <SectionHeader
        size="sm"
        title="Produtos vendidos"
        actions={
          <Button
            size="sm"
            variant="secondary"
            disabled={lines.length >= 200}
            onClick={() => onChange([...lines, { name: '', code: '', quantity: 1, unitPrice: '', kit: false }])}
          >
            Adicionar linha
          </Button>
        }
      />
      {lines.map((line, index) => (
        <section className="planner-sale-line" key={index} aria-label={`Produto ${index + 1}`}>
          <FieldGrid>
            <Input
              label={`Produto ${index + 1} · obrigatório`}
              required
              maxLength={300}
              value={line.name}
              onInput={(event) => change(index, { name: event.currentTarget.value, code: '' })}
            />
            <Input
              label={`Quantidade ${index + 1} · obrigatória`}
              required
              type="number"
              min="1"
              max="9999"
              step="1"
              value={line.quantity}
              onInput={(event) => {
                const quantity = Number(event.currentTarget.value);
                change(index, { quantity, ...(quantity < 2 ? { kit: false } : {}) });
              }}
            />
            <Input
              label={`Preço unitário ${index + 1} (R$) · obrigatório`}
              required
              type="number"
              min="0.01"
              step="0.01"
              value={line.unitPrice === '' ? '' : typeof line.unitPrice === 'number' ? line.unitPrice.toFixed(2) : line.unitPrice}
              onInput={(event) => change(index, { unitPrice: event.currentTarget.value })}
            />
          </FieldGrid>
          <div className="ds-inline">
            <Checkbox
              checked={Boolean(line.kit) && line.quantity >= 2}
              disabled={line.quantity < 2}
              onChange={(event) => change(index, { kit: event.currentTarget.checked })}
            >
              Kit · produto {index + 1}
            </Checkbox>
            <Button
              size="sm"
              variant="ghost"
              disabled={lines.length === 1}
              onClick={() => onChange(lines.filter((_line, i) => i !== index))}
            >
              Remover linha {index + 1}
            </Button>
          </div>
        </section>
      ))}
    </section>
  );
}
