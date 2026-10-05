import { Button, Icon, Input, Select } from '../../../../design-system/components/index.js';
export function IngredientsEditor({ values, products, onChange, disabled }) {
  const update = (index, patch) => onChange(values.map((value, i) => (i === index ? { ...value, ...patch } : value)));
  return (
    <section className="creation-fields" aria-label="Ingredientes da receita">
      <h3 className="ds-heading-h5">Ingredientes</h3>
      {values.map((value, index) => (
        <div key={index} className="creation-ingredient">
          <Select
            label={`Produto do ingrediente ${index + 1}`}
            value={value.productId}
            options={[
              { value: '', label: 'Escolha um produto' },
              ...products.map((x) => ({ value: x.id, label: `${x.name} · ${x.unit}` }))
            ]}
            onChange={(productId) => update(index, { productId })}
            searchable
            disabled={disabled}
          />
          <Input
            label={`Quantidade do ingrediente ${index + 1}`}
            type="number"
            min="0.001"
            step="any"
            value={value.quantity}
            onInput={(e) => update(index, { quantity: e.currentTarget.value })}
            required
            disabled={disabled}
          />
          <Button
            type="button"
            variant="ghost"
            aria-label={`Remover ingrediente ${index + 1}`}
            disabled={disabled}
            onClick={() => onChange(values.filter((_, i) => i !== index))}
          >
            <Icon name="delete" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" disabled={disabled} onClick={() => onChange([...values, { productId: '', quantity: 1 }])}>
        <Icon name="plus" /> Adicionar ingrediente
      </Button>
    </section>
  );
}
