import { Select } from '../../../../design-system/components/index.js';
export function DeleteReferences({ type, item, data, choices, onChange, disabled }) {
  const candidates = (type === 'products' ? data.vocabulary.products : data.vocabulary.categories).filter(
    (x) => x.id !== item.id && x.active !== false && (type === 'products' || x.type === item.type)
  );
  return (
    <div className="creation-fields">
      {Object.entries(data.groups).flatMap(([group, rows]) =>
        rows.map((row, i) => {
          const key = `${group}:${i}`;
          const optional = ['ingredients', 'sections', 'product_sections'].includes(group);
          const name = row.name || row.recipe?.name || row.product?.name || 'Item associado';
          const options = [
            { value: '', label: 'Escolha uma resolução' },
            ...(optional
              ? [{ value: 'remove', label: group === 'ingredients' ? 'Remover ingrediente da receita' : 'Remover vínculo com esta seção' }]
              : []),
            ...candidates
              .filter((x) => (row.scope || row.recipe?.scope || row.product?.scope) !== 'site' || x.scope === 'site')
              .map((x) => ({ value: x.id, label: `Substituir por ${x.name}` }))
          ];
          return (
            <Select
              key={key}
              label={`${name} — ${group === 'ingredients' ? 'ingrediente' : optional ? 'seção' : 'categoria principal'}`}
              value={choices[key] || ''}
              options={options}
              searchable
              disabled={disabled}
              onChange={(value) => onChange({ ...choices, [key]: value })}
            />
          );
        })
      )}
    </div>
  );
}
