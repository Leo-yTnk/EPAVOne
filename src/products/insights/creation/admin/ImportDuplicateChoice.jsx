import { useState } from 'preact/hooks';
import { Alert, Button, Card, Select } from '../../../../design-system/components/index.js';
import { creationService } from '../services/creationService.js';
import { CreationThumbnail } from '../components/CreationThumbnail.jsx';
const fields = {
  name: 'Nome',
  category: 'Categoria',
  type: 'Tipo',
  unit: 'Unidade',
  image_url: 'Imagem',
  prep_time: 'Tempo',
  servings: 'Porções',
  difficulty: 'Dificuldade',
  instructions: 'Preparo',
  extras: 'Extras',
  tips: 'Dicas',
  sort_order: 'Ordem',
  active: 'Ativa',
  ingredients: 'Ingredientes',
  featured: 'Destaque'
};
const display = (value) =>
  value == null || value === ''
    ? 'Não informado'
    : Array.isArray(value)
      ? value
          .map((item) =>
            typeof item === 'object'
              ? `${item.quantity} ${item.product?.unit || ''} · ${typeof item.product === 'object' ? item.product.name : item.product}`
              : item
          )
          .join(' · ')
      : typeof value === 'object'
        ? value.name || JSON.stringify(value)
        : String(value);
export function ImportDuplicateChoice({ entity, row, existing, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function compare() {
    setOpen(!open);
    if (open || entity !== 'recipes' || detail || loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await creationService.detail('recipes', existing);
      setDetail({ ...existing, ...data.recipe, ingredients: data.ingredients });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }
  const keys = {
    products: ['name', 'category', 'unit', 'image_url'],
    recipes: [
      'name',
      'category',
      'prep_time',
      'servings',
      'difficulty',
      'image_url',
      'featured',
      'ingredients',
      'instructions',
      'extras',
      'tips'
    ],
    categories: ['name', 'type'],
    sections: ['name', 'sort_order', 'active']
  }[entity];
  return (
    <div className="creation-fields creation-duplicate-choice">
      <Select
        label={`Duplicata de ${row.name}: manter qual conteúdo?`}
        value={value}
        disabled={disabled}
        options={[
          { value: 'original', label: 'Manter original (existente)' },
          { value: 'imported', label: 'Usar conteúdo importado' }
        ]}
        onChange={onChange}
      />
      <Button variant="ghost" size="sm" aria-expanded={open} onClick={compare}>
        {open ? 'Ocultar comparação' : 'Comparar original e importado'}
      </Button>
      {open && loading && <p role="status">Carregando os ingredientes originais…</p>}
      {open && error && (
        <Alert tone="danger" title="Comparação incompleta">
          {error}
        </Alert>
      )}
      {open && (
        <div className="creation-duplicate-comparison">
          {[
            ['Original', detail || existing],
            ['Importado', row]
          ].map(([label, item]) => (
            <Card key={label} className="creation-fields">
              <strong>{label}</strong>
              {['products', 'recipes'].includes(entity) && <CreationThumbnail item={item} type={entity} />}
              <dl>
                {keys.map((key) => (
                  <div key={key}>
                    <dt>{fields[key]}</dt>
                    <dd>{display(item[key])}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      )}
      {value === 'imported' && (
        <p>
          {
            {
              products: 'Atualiza nome, categoria, unidade e imagem. Preserva ID, vínculos, estado ativo e dados de preço e fonte Swift.',
              recipes: 'Atualiza os dados da receita, preparo e ingredientes. Preserva ID, estado de publicação e demais vínculos.',
              categories: 'Atualiza o nome da categoria. Preserva ID, tipo e estado ativo.',
              sections: 'Atualiza nome, ordem e visibilidade da seção. Preserva ID e vínculos.'
            }[entity]
          }
        </p>
      )}
    </div>
  );
}
