import { Button, Card, SummaryList, SectionHeader, ActionGroup } from '../../../design-system/components/index.js';
import { orderCpf, exportCpf, validCpf } from '../models/order.js';
export function OrderReview({ template, order, onNavigate, busy }) {
  const cpf = orderCpf(template, order);
  return (
    <Card className="writer-details">
      <SectionHeader eyebrow="4 · Conferência" title="Confira antes de gerar o Excel" />
      <SummaryList
        layout="rows"
        items={[
          { label: 'Cliente', value: order.client },
          { label: 'CPF no Excel', value: validCpf(cpf) ? exportCpf(cpf) : 'Confira o CPF' },
          { label: 'Telefone', value: order.phone },
          {
            label: 'Aluno e turma',
            value: (
              <>
                {order.student} · {order.room}
              </>
            )
          },
          {
            label: 'Entrega',
            value: (
              <>
                {order.method}
                {order.store ? ` · ${order.store}` : ''}
              </>
            )
          },
          { label: 'Data', value: order.date.split('-').reverse().join('/') },
          { label: 'Pagamento', value: order.payment }
        ]}
      />
      <ActionGroup align="start">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => onNavigate(0)}>
          Editar cliente
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => onNavigate(1)}>
          Editar produtos
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => onNavigate(2)}>
          Editar entrega
        </Button>
      </ActionGroup>
    </Card>
  );
}
