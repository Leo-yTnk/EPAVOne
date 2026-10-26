import { useEffect, useState } from 'preact/hooks';
import { Alert, Button, Select } from '../../../design-system/components/index.js';
import { matchProduct } from '../../../shared/services/orderMatching.js';
import { weeklyOrder } from '../../../shared/services/weeklyOrder.js';
import { useWeeklyOrder } from '../../../shared/services/useWeeklyOrder.js';
export function InsightsProductHandoff({ template, onAdd, busy, expired }) {
  const { request } = useWeeklyOrder();
  const [selected, setSelected] = useState('');
  useEffect(() => setSelected(''), [request?.id, template]);
  if (!request) return null;
  const match = matchProduct(request, template?.products || []);
  const choices = match.candidates;
  const name = selected || (choices.length === 1 && !match.requiresChoice ? choices[0].name : '');
  const product = choices.find((item) => item.name === name);
  return (
    <Alert tone="info" title="Produto escolhido no Insights">
      <p>{request.name}. Confirme o produto e o preço do Excel; o carrinho atual será preservado.</p>
      {template && <p role="status">{match.explanation}</p>}
      {!template ? (
        <p>Carregue o formulário atualizado para encontrar o produto.</p>
      ) : !choices.length ? (
        <p>Não encontramos uma correspondência segura. Busque o produto no catálogo do Writer; nenhuma substituição foi adicionada.</p>
      ) : (
        <Select
          label="Produto correspondente no Excel"
          value={name}
          options={[
            { value: '', label: 'Escolha a apresentação' },
            ...choices.map((item) => ({
              value: item.name,
              label: `${item.name} · ${item.code || 'sem código'} · ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}`
            }))
          ]}
          onChange={setSelected}
        />
      )}
      <div className="ds-inline">
        <Button
          size="sm"
          disabled={busy || expired || !product || !Number.isFinite(product.price) || product.price <= 0}
          onClick={() => {
            onAdd(product.name);
            weeklyOrder.dismiss(request.id);
          }}
        >
          Adicionar 1 unidade ao pedido
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => weeklyOrder.dismiss(request.id)}>
          Dispensar sugestão
        </Button>
      </div>
    </Alert>
  );
}
