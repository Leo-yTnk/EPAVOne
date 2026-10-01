import { Button, Card } from '../../../design-system/components/index.js';
import { orderCpf, exportCpf, validCpf } from '../models/order.js';
export function OrderReview({ template, order, onNavigate, busy }) {
  const cpf = orderCpf(template, order);
  return (
    <Card className="writer-details">
      <span className="ds-overline">4 · Conferência</span>
      <h2 className="ds-heading-h3">Confira antes de gerar o Excel</h2>
      <dl className="writer-derived">
        <dt>Cliente</dt>
        <dd>{order.client}</dd>
        <dt>CPF no Excel</dt>
        <dd>{validCpf(cpf) ? exportCpf(cpf) : 'Confira o CPF'}</dd>
        <dt>Telefone</dt>
        <dd>{order.phone}</dd>
        <dt>Aluno e turma</dt>
        <dd>
          {order.student} · {order.room}
        </dd>
        <dt>Entrega</dt>
        <dd>
          {order.method}
          {order.store ? ` · ${order.store}` : ''}
        </dd>
        <dt>Data</dt>
        <dd>{order.date.split('-').reverse().join('/')}</dd>
        <dt>Pagamento</dt>
        <dd>{order.payment}</dd>
      </dl>
      <div className="writer-step-buttons">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => onNavigate(0)}>
          Editar cliente
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => onNavigate(1)}>
          Editar produtos
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={() => onNavigate(2)}>
          Editar entrega
        </Button>
      </div>
    </Card>
  );
}
