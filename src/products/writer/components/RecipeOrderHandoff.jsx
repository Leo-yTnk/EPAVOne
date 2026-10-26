import { useMemo, useState } from 'preact/hooks';
import { Button, Checkbox, Dialog, Input, Select } from '../../../design-system/components/index.js';
import { recipeRows, recipeLines } from '../../../shared/services/recipeOrder.js';
import { weeklyOrder } from '../../../shared/services/weeklyOrder.js';
const money = (value) =>
  Number.isFinite(value) && value > 0
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : 'Sem preço válido';
export function RecipeOrderHandoff({ request, template, busy, expired, onAdd }) {
  const [open, setOpen] = useState(false);
  const [selections, setSelections] = useState({});
  const [failure, setFailure] = useState('');
  const rows = useMemo(() => recipeRows(request, template?.products || []), [request, template]);
  let lines = [],
    issue = '';
  try {
    lines = recipeLines(rows, selections);
  } catch (error) {
    issue = error.message;
  }
  function update(key, patch) {
    setSelections((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
    setFailure('');
  }
  return (
    <>
      <div className="ds-inline">
        <span>
          Receita: <strong>{request.name}</strong> · {rows.length} produtos
        </span>
        <Button size="sm" variant="secondary" disabled={busy || !template} onClick={() => setOpen(true)}>
          Revisar receita
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => weeklyOrder.dismiss(request.id)}>
          Dispensar receita
        </Button>
        {!template && <span>Carregue o Excel para conferir os ingredientes.</span>}
      </div>
      <Dialog
        open={open}
        title={`Pedido da receita: ${request.name}`}
        size="lg"
        onClose={() => setOpen(false)}
        actions={
          <Button
            disabled={busy || expired || Boolean(issue)}
            onClick={() => {
              try {
                onAdd(lines);
                weeklyOrder.dismiss(request.id);
                setOpen(false);
              } catch (error) {
                setFailure(error.message);
              }
            }}
          >
            Adicionar produtos conferidos
          </Button>
        }
      >
        <p>
          Confira cada apresentação e o número de embalagens. As quantidades da receita são uma referência; os preços e produtos disponíveis
          vêm do Excel.
        </p>
        <div className="writer-recipe-rows">
          {rows.map((row) => {
            const selection = selections[row.key] || {};
            const name =
              selection.name ?? (!row.match.requiresChoice && row.match.candidates.length === 1 ? row.match.candidates[0].name : '');
            return (
              <section key={row.key} className="writer-recipe-row">
                <strong>{row.name}</strong>
                <p className="writer-muted">
                  Receita: {row.quantity || 'quantidade não informada'} {row.unit || ''}
                </p>
                {row.match.candidates.length ? (
                  <Select
                    label={`Produto do Excel para ${row.name}`}
                    value={name}
                    disabled={Boolean(selection.skip)}
                    onChange={(name) => update(row.key, { name })}
                    options={[
                      { value: '', label: 'Selecione a apresentação' },
                      ...row.match.candidates.map((item) => ({ value: item.name, label: `${item.name} · ${money(item.price)}` }))
                    ]}
                  />
                ) : (
                  <p>
                    Não disponível nesta apresentação no Excel. Marque a exclusão somente se tiver o ingrediente ou for providenciá-lo à
                    parte.
                  </p>
                )}
                <Input
                  label={`Embalagens de ${row.name}`}
                  type="number"
                  min="1"
                  max="9999"
                  step="1"
                  disabled={Boolean(selection.skip)}
                  value={selection.quantity ?? row.suggestedQuantity}
                  onInput={(event) => update(row.key, { quantity: event.currentTarget.value })}
                />
                <Checkbox checked={Boolean(selection.skip)} onChange={(event) => update(row.key, { skip: event.currentTarget.checked })}>
                  Não incluir {row.name} (já tenho ou vou providenciar à parte)
                </Checkbox>
              </section>
            );
          })}
        </div>
        {request.extras.length > 0 && (
          <details>
            <summary>Outros ingredientes da receita · providenciar à parte</summary>
            <ul>
              {request.extras.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </details>
        )}
        {(issue || failure) && <p role="status">{failure || issue}</p>}
      </Dialog>
    </>
  );
}
