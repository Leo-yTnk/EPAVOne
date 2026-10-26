import { useState } from 'preact/hooks';
import { Button, Dialog, FieldGrid, Input, Textarea, SummaryList } from '../../../design-system/components/index.js';
import { saleDay, saleMoney, saleTotals, validateSale, cents } from '../../../shared/services/sales.js';
import { SaleLinesEditor } from './SaleLinesEditor.jsx';
export function SaleEditor({ initial, busy, error, onSave, onClose }) {
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [attempt, setAttempt] = useState(false);
  const change = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const totals = saleTotals(draft);
  async function save(event) {
    event.preventDefault();
    setAttempt(true);
    if (!validateSale(draft).length) await onSave(draft);
  }
  return (
    <Dialog open size="lg" title={draft.revision ? 'Editar venda' : 'Registrar venda'} onClose={() => !busy && onClose()}>
      <form className="planner-form" onSubmit={save}>
        <FieldGrid>
          <Input
            label="Cliente · obrigatório"
            required
            maxLength={300}
            value={draft.customer.name}
            onInput={(event) => change({ customer: { ...draft.customer, name: event.currentTarget.value } })}
          />
          <Input
            label="Data da venda · obrigatória"
            type="date"
            required
            max={saleDay()}
            value={draft.saleDate}
            onInput={(event) => change({ saleDate: event.currentTarget.value })}
          />
          <Input
            label="CPF ou referência do cliente · opcional"
            value={draft.customer.cpf || ''}
            maxLength={20}
            onInput={(event) => change({ customer: { ...draft.customer, cpf: event.currentTarget.value } })}
            helper="Use a mesma referência para identificar compras do mesmo cliente. Na ausência, usamos o nome completo."
          />
          <Input
            label="Forma de pagamento"
            value={draft.payment || ''}
            onInput={(event) => change({ payment: event.currentTarget.value })}
          />
          <Input
            label="Frete cobrado (R$)"
            type="number"
            min="0"
            step="0.01"
            value={(Number(draft.shippingCents || 0) / 100).toFixed(2)}
            onInput={(event) => change({ shippingCents: cents(event.currentTarget.value) })}
          />
          <Input
            label="Data de entrega ou retirada"
            type="date"
            value={draft.delivery?.date || ''}
            onInput={(event) => change({ delivery: { ...draft.delivery, date: event.currentTarget.value } })}
          />
        </FieldGrid>
        <SaleLinesEditor lines={draft.lines} onChange={(lines) => change({ lines })} />
        <SummaryList
          items={[
            { label: 'Total da venda', value: saleMoney(totals.amountCents) },
            { label: 'Produtos distintos / unidades', value: `${totals.distinct} / ${totals.units}` }
          ]}
        />
        <Textarea
          label="Observações"
          maxLength={4000}
          value={draft.notes || ''}
          onInput={(event) => change({ notes: event.currentTarget.value })}
        />
        {draft.source === 'writer' && (
          <details>
            <summary>Dados recebidos do pedido</summary>
            <p>
              {draft.student?.name} · {draft.student?.room} · {draft.delivery?.method} · {draft.template?.filename}
            </p>
            <p>
              {draft.customer.address} · {draft.customer.phone}
            </p>
          </details>
        )}
        {(error || (attempt && validateSale(draft).length > 0)) && <p role="alert">{error || validateSale(draft).join(' ')}</p>}
        <div className="ds-inline">
          <Button type="submit" loading={busy}>
            Confirmar e salvar venda
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
