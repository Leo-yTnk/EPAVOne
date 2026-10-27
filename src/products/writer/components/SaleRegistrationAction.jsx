import { Button, Card, ActionGroup } from '../../../design-system/components/index.js';
import { salesTransfer } from '../../../shared/services/sales.js';
export function SaleRegistrationAction({ draft, onNew }) {
  if (!draft) return null;
  return (
    <Card padding="compact" className="writer-export-actions">
      <p>Pedido baixado. Se a compra foi confirmada, confira e registre a venda no Planner.</p>
      <ActionGroup>
        <Button
          onClick={() => {
            salesTransfer.send(draft);
            window.location.hash = '#/planner/resultados/pedidos';
          }}
        >
          Registrar como venda no Planner
        </Button>
        <Button variant="secondary" onClick={onNew}>
          Novo pedido
        </Button>
      </ActionGroup>
    </Card>
  );
}
